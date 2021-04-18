import { SNSHandler, SNSEvent } from 'aws-lambda';
import 'source-map-support/register';
import { syncUploadedFileToInvite } from 'src/logic/invites';

export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log('Processing SNS event', JSON.stringify(event));
    for (const record of event.Records) {
        const eventStr = record.Sns.Message;
        console.log('Processing S3 event', eventStr);
        const event = JSON.parse(eventStr);
        if (event.Records) {
            for (const record of event.Records) {
                const key = record.s3.object.key;
                console.log('Processing S3 item with key:', key);
                try {
                    const invite = await syncUploadedFileToInvite(key);
                    console.log('Added file path to invite set', invite);
                } catch (e) {
                    console.log('Failed to sync file to invite', e);
                }
            }
        }
    }
};
