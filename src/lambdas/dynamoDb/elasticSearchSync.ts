import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import * as elasticsearch from 'elasticsearch';
import * as httpAwsEs from 'http-aws-es';

const esHost = process.env.ES_ENDPOINT;

const es = new elasticsearch.Client({
    hosts: [ esHost ],
    connectionClass: httpAwsEs,
});

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    console.log('Processing events batch from DynamoDB', JSON.stringify(event));

    for (const record of event.Records) {
        console.log('Processing record', JSON.stringify(record));

        if (record.eventName !== 'INSERT') {
            continue;
        }

        const newItem = record.dynamodb.NewImage;
        const guestId = newItem.guestId.S
        const body = {
            guestId: newItem.guestId.S,
            inviteId: newItem.inviteId.S,
            fullName: newItem.fullName.S,
            accepted: newItem.accepted?.BOOL,
        };

        await es.index({
            index: 'guests-index',
            type: 'guests',
            id: guestId,
            body,
        });   
    };
};