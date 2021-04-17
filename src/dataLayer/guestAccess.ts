import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Guest } from 'src/models/Guest';
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

const XAWS = AWSXRay.captureAWS(AWS);

export class GuestAccess {
    
    constructor(
        private readonly docClient: DocumentClient = createDynamoDbClient(),
        private readonly guestsTable = process.env.GUESTS_TABLE
    ) {}

    async getGuest(inviteId: string, guestId: string): Promise<Guest> {
        const guest = await this.docClient.get({
            TableName: this.guestsTable,
            Key: {
                inviteId: inviteId,
                guestId: guestId
            }
        }).promise();

        return guest.Item as Guest;
    }

    async getGuestsInInvite(inviteId: string, limit?: number, nextKey?: string): Promise<[Guest[], DocumentClient.Key]> {
        let exclusiveStartKey;
        if (nextKey) {
            exclusiveStartKey = {
                inviteId: inviteId,
                guestId: nextKey,
            }
        }
        
        const result = await this.docClient.query({
            TableName: this.guestsTable,
            Limit: limit,
            ExclusiveStartKey: exclusiveStartKey,
            KeyConditionExpression: 'inviteId = :inviteId',
            ExpressionAttributeValues: {
                ':inviteId': inviteId
            },
            ScanIndexForward: false
        }).promise()
    
        return [
            result.Items as Guest[],
            result.LastEvaluatedKey
        ];
    }

    async createGuest(guest: Guest): Promise<Guest> {
        console.log(`Creating a guest with id ${guest.inviteId}/${guest.guestId}`);

        await this.docClient.put({
            TableName: this.guestsTable,
            Item: guest
        }).promise();

        return guest;
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