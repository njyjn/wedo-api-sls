import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { createInvite, queueGenerateQrCode } from "src/logic/invites";
import { CreateInviteRequest } from 'src/requests/CreateInviteRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    let response;

    try {
        const userId = event.requestContext.authorizer.principalId;
        const newInvite: CreateInviteRequest = JSON.parse(event.body);

        // Create record
        const newItem = await createInvite(
            userId,
            newInvite
        );

        // Queue QR code creation
        await queueGenerateQrCode(userId, newItem.inviteId);

        response = {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                newItem: newItem,
            }),
        };
    } catch(e) {
        console.log('Error: ', e);
        response = {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: e
            }),
        };
    } finally {
        return response;
    }
};
