import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { deleteInvite, inviteExists } from "src/logic/invites";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    let response;

    try {
        const userId = event.requestContext.authorizer.principalId;
        const inviteId = event.pathParameters.inviteId;
        const validInviteId = await inviteExists(userId, inviteId);
        if (!validInviteId) {
            response = {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Invite does not exist'
                })
            }
        } else {
            await deleteInvite(userId, inviteId);
            response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: '',
            };
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
