import { SNSHandler, SNSEvent } from 'aws-lambda';
import 'source-map-support/register';
import { generateQrCode, getUploadUrl} from 'src/logic/invites';

export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log('Processing SNS event ', JSON.stringify(event));
    for (const record of event.Records) {
        const eventStr = record.Sns.Message;
        console.log('Processing S3 event', eventStr);
        const event = JSON.parse(eventStr);
        const inviteId = event.inviteId.toString();
        const userId = event.userId.toString();
        const uploadUrl = await getUploadUrl(userId, inviteId);

        // Generate and upload QR code
        await generateQrCode(inviteId, uploadUrl);
    }
};

// For websockets
// async function processEvent(event: ) {
//     for (const record of event.Records) {
//         const key = record.s3.object.key;
//         console.log('Processing S3 item with key: ', key);

//         const connections = await docClient.scan({
//             TableName: connectionsTable
//         }).promise();

//         const payload = {
//             qrCodeS3Path: key
//         };

//         for (const connection of connections.Items) {
//             const connectionId = connection.id;
//             await sendMessageToClient(connectionId, payload);
//         }
//     };
// };

// async function sendMessageToClient(connectionId: string, payload: any) {
//     try {
//         console.log('Sending message to connection ', connectionId);

//         await apiGateway.postToConnection({
//             ConnectionId: connectionId,
//             Data: JSON.stringify(payload),
//         }).promise();
//     } catch (err) {
//         console.log('Failed to send message to connection ', connectionId, '. Error: ', err);
//         if (err.statusCode === 410) {
//             console.log('Connection ', connectionId, ' is stale. Disconnecting...');

//             await docClient.delete({
//                 TableName: connectionsTable,
//                 Key: {
//                     id: connectionId
//                 },
//             }).promise();
//         }
//     }
// };