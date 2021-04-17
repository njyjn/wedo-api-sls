import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'wedo-api',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
    documentation: {
      api: {
        info: {
          version: 'v1.0.0',
          title: 'wedo-api',
          description: 'Serverless application for wedding invite system',
        }
      },
      models: [
        {
          name: 'InviteRequest',
          contentType: 'application/json',
          schema: '${file(api_schema/create_invite_request.json)}'
        },
        {
          name: 'GuestRequest',
          contentType: 'application/json',
          schema: '${file(api_schema/create_guest_request.json)}'
        }
      ]
    },
    'serverless-offline': {
      httpPort: 3003,
    },
    // local dynamodb
    dynamodb: {
      stages: [
        'dev'
      ],
      start: {
        image: 'dynamodb-local',
        port: 8000,
        noStart: true,
        migrate: true,
        seed: true,
      },
      seed: {
        invites: {
          sources: [
            {
              table: 'wedo-invites-dev',
              sources: [
                'docker/dynamodb/seeds/invites.json'
              ]
            }
          ]
        }
      }
    }
  },
  plugins: [
    'serverless-dotenv-plugin',
    'serverless-webpack',
    'serverless-aws-documentation',
    'serverless-iam-roles-per-function',
    'serverless-plugin-canary-deployments',
    'serverless-dynamodb-local',
    'serverless-offline',
  ],
  package: {
    excludeDevDependencies: true,
    individually: true
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    tracing: {
      lambda: true,
      apiGateway: true,
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: [
        {
          Dev: [
            'devKey'
          ]
        }
      ],
      usagePlan: [
        {
          Dev: {
            quota: {
              limit: 5000,
              offset: 2,
              period: 'MONTH'
            },
            throttle: {
              burstLimit: 5,
              rateLimit: 5
            }
          }
        }
      ]
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      INVITES_TABLE: "wedo-invites-${self:provider.stage}",
      INVITES_INDEX: "InvitesIndex",
      GUESTS_TABLE: "wedo-guests-${self:provider.stage}",
      GUESTS_INDEX: 'GuestsIndex',
      CONNECTIONS_TABLE: "wedo-connections-${self:provider.stage}",
      DOCUSTORE_S3_BUCKET: 'wedo-docustore-${self:provider.stage}',
      SIGNED_URL_EXPIRATION: '300',
      GUESTS_ES_INSTANCE: 'wedo-guests-search-${self:provider.stage}',
      DOCUSTORE_TOPIC_NAME: 'wedo-docustoreTopic-${self:provider.stage}',
      GENERIC_TOPIC_NAME: 'wedo-topic-${self:provider.stage}',
      AWS_ACCOUNT_ID: {
        "Fn::Sub": "${AWS::AccountId}"
      },
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'codedeploy:*'
        ],
        Resource: [
          '*'
        ]
      }
    ],
    lambdaHashingVersion: '20201221',
    stage: "${opt:stage, 'dev'}",
    // @ts-ignore
    region: "${opt:region, 'us-east-1'}",
  },
  functions: {
    AuthWithCert: {
      environment: {
        JWKS_URL: "${env:JWKS_URL}"
      },
      handler: 'src/lambdas/auth/customAuthWithCert.handler'
    },
    GenerateQrCode: {
      handler: 'src/lambdas/sns/generateQrCode.handler',
      events: [
        {
          sns: {
            arn: {
              "Fn::Sub": "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:${self:provider.environment.GENERIC_TOPIC_NAME}"
            },
            topicName: "${self:provider.environment.GENERIC_TOPIC_NAME}",
            filterPolicy: {
              channel: [
                'generateQrCode'
              ]
            }
          }
        }
      ],
      //@ts-ignore
      iamRoleStatements: [
        {
          Effect: 'Allow',
          Action: [
            's3:PutObject',
            's3:GetObject',
          ],
          Resource: "arn:aws:s3:::${self:provider.environment.DOCUSTORE_S3_BUCKET}/*",
        },
      ]
    },
    CreateInvite: {
      handler: 'src/lambdas/http/createInvite.handler',
      events: [
        {
          http: {
            method: 'post',
            path: 'invites',
            cors: true,
            private: true,
            authorizer: {
              name: 'AuthWithCert'
            },
            request: {
              schema: {
                'application/json': "${file(models/create-invite-request.json)}"
              },
            },
            // broken, see https://forum.serverless.com/t/unrecognized-property-documentation/12885
            // @ts-ignore
            documentation: {
              summary: 'Create a new invite',
              description: 'Create a new invite',
              requestModels: {
                'application/json': 'InviteRequest'
              }
            }
          }
        }
      ],
      iamRoleStatements: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:PutItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:PutItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}/index/${self:provider.environment.INVITES_INDEX}",
        },
        {
          Effect: 'Allow',
          Action: [
            'sns:Publish'
          ],
          Resource: {
            "Fn::Sub": "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:${self:provider.environment.GENERIC_TOPIC_NAME}",
          }
        },  
      ]
    },
    GetInvites: {
      handler: 'src/lambdas/http/getInvites.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'invites',
            cors: true,
            private: true,
            authorizer: {
              name: 'AuthWithCert'
            },
          }
        }
      ],
      //@ts-ignore
      iamRoleStatements: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:Query'
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:Query',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}/index/${self:provider.environment.INVITES_INDEX}",
        },
      ]
    },
    CreateGuest: {
      handler: 'src/lambdas/http/createGuest.handler',
      events: [
        {
          http: {
            method: 'post',
            path: 'invites/{inviteId}/guests',
            cors: true,
            private: true,
            authorizer: {
              name: 'AuthWithCert'
            },
            request: {
              schema: {
                'application/json': "${file(models/create-guest-request.json)}"
              },
            },
            // broken, see https://forum.serverless.com/t/unrecognized-property-documentation/12885
            // @ts-ignore
            documentation: {
              summary: 'Create a new guest',
              description: 'Create a new guest',
              requestModels: {
                'application/json': 'GuestRequest'
              }
            }
          }
        }
      ],
      iamRoleStatements: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:PutItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GUESTS_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:PutItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GUESTS_TABLE}/index/${self:provider.environment.GUESTS_INDEX}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}/index/${self:provider.environment.INVITES_INDEX}",
        },
      ]
    },
    GetGuests: {
      handler: 'src/lambdas/http/getGuests.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'invites/{inviteId}/guests',
            cors: true,
            private: true,
            authorizer: {
              name: 'AuthWithCert'
            },
          }
        }
      ],
      //@ts-ignore
      iamRoleStatements: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:Query',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GUESTS_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:Query',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GUESTS_TABLE}/index/${self:provider.environment.GUESTS_INDEX}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem'
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}/index/${self:provider.environment.INVITES_INDEX}",
        },
      ]
    },
    GetGuest: {
      handler: 'src/lambdas/http/getGuest.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'invites/{inviteId}/guests/{guestId}',
            cors: true,
            private: true,
            authorizer: {
              name: 'AuthWithCert'
            },
          }
        }
      ],
      //@ts-ignore
      iamRoleStatements: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GUESTS_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GUESTS_TABLE}/index/${self:provider.environment.GUESTS_INDEX}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}",
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
          ],
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.INVITES_TABLE}/index/${self:provider.environment.INVITES_INDEX}",
        },
      ]
    },
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          ResponseParameters: {
            'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
            'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization'",
            'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,OPTIONS,POST'",
          },
          ResponseType: 'DEFAULT_4XX',
          RestApiId: {
            Ref: 'ApiGatewayRestApi'
          }
        }
      },  
      GenericTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          DisplayName: 'Generic topic',
          TopicName: "${self:provider.environment.GENERIC_TOPIC_NAME}", 
        }
      },
      InvitesDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'userId',
              AttributeType: 'S'
            },
            {
              AttributeName: 'inviteId',
              AttributeType: 'S'
            },
            {
              AttributeName: 'type',
              AttributeType: 'S'
            },
          ],
          KeySchema: [
            {
              AttributeName: 'userId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'inviteId',
              KeyType: 'RANGE'
            }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.INVITES_INDEX}",
              KeySchema: [
                {
                  AttributeName: 'userId',
                  KeyType: 'HASH'
                },    
                {
                  AttributeName: 'type',
                  KeyType: 'RANGE'
                }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: "${self:provider.environment.INVITES_TABLE}"
        }
      },
      GuestsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'inviteId',
              AttributeType: 'S'
            },
            {
              AttributeName: 'guestId',
              AttributeType: 'S'
            },
          ],
          KeySchema: [
            {
              AttributeName: 'inviteId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'guestId',
              KeyType: 'RANGE'
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: "${self:provider.environment.GUESTS_TABLE}"
        }
      },
      DocustoreBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: "${self:provider.environment.DOCUSTORE_S3_BUCKET}",
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: [
                  '*'
                ],
                AllowedHeaders: [
                  '*'
                ],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD'
                ],
                MaxAge: 3000,
              }
            ]
          }
        }
      },
      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument: {
            Id: 'WedoDocustorePolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: "arn:aws:s3:::${self:provider.environment.DOCUSTORE_S3_BUCKET}/*"
              }
            ]
          },
          Bucket: {
            Ref: 'DocustoreBucket'
          }
        }
      },
    }
  }
};

module.exports = serverlessConfiguration;
