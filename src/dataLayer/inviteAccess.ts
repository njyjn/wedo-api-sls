import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Invite } from 'src/models/Invite';
import { UpdateInviteRequest } from 'src/requests/UpdateInviteRequest';
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

const XAWS = AWSXRay.captureAWS(AWS);

export class InviteAccess {
    
    constructor(
        private readonly docClient: DocumentClient = createDynamoDbClient(),
        private readonly invitesTable = process.env.INVITES_TABLE,
        private readonly invitesIndex = process.env.INVITES_INDEX
    ) {}

    async getAllInvites(userId: string, limit?: number, nextKey?: string): Promise<[Invite[], DocumentClient.Key]> {
        console.log('Getting all invites for', userId);

        let exclusiveStartKey;
        if (nextKey) {
            exclusiveStartKey = { 
                inviteId: nextKey,
                userId: userId, 
            };
        }

        const result = await this.docClient.query({
            TableName: this.invitesTable,
            IndexName: this.invitesIndex,
            Limit: limit,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId 
            },
            ExclusiveStartKey: exclusiveStartKey,
        }).promise();
    
        const invites = result.Items as Invite[];
        const lastEvaluatedKey = result.LastEvaluatedKey;
        return [invites, lastEvaluatedKey] ;
    };

    async createInvite(invite: Invite): Promise<Invite> {
        console.log(`Creating an invite with id ${invite.inviteId}`);

        await this.docClient.put({
            TableName: this.invitesTable,
            Item: invite
        }).promise();

        return invite;
    };

    async updateInvite(userId: string, inviteId: string, inviteItem: UpdateInviteRequest): Promise<any> {
        console.log(`Editing invite of id ${inviteId}`);

        const invite = await this.docClient.update({
            TableName: this.invitesTable,
            Key: {
                userId: userId,
                inviteId: inviteId
            },
            UpdateExpression: 'SET familyName = :familyName, #T = :inviteType, responded = :responded',
            ExpressionAttributeValues: {
                ':familyName': inviteItem.familyName,
                ':inviteType': inviteItem.type,
                ':responded': inviteItem.responded
            },
            ExpressionAttributeNames: {
                '#T': 'type'
            },
            ReturnValues: 'UPDATED_NEW'
        }).promise();

        return invite.Attributes;
    }

    async deleteInvite(userId: string, inviteId: string): Promise<void> {
        console.log(`Deleting invite of id ${inviteId}`);

        await this.docClient.delete({
            TableName: this.invitesTable,
            Key: {
                userId: userId,
                inviteId: inviteId
            }
        }).promise();
    }

    async inviteExists(userId: string, inviteId: string): Promise<boolean> {
        const result = await this.docClient.get({
            TableName: this.invitesTable,
            Key: {
                userId: userId,
                inviteId: inviteId
            }
        }).promise();
    
        console.log('Get invite: ', result);
        return !!result.Item;
    }    
};

function createDynamoDbClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance...');
        return new DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000',
        });
    }

    return new XAWS.DynamoDB.DocumentClient();
};