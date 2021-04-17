import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { getInvite } from 'src/logic/invites';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);
    
    let response;
    try {
        const userId = event.requestContext.authorizer.principalId;
        const inviteId = event.pathParameters.inviteId;
        const invite = await getInvite(userId, inviteId);
        if (!invite) {
            response = {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Invite not found'
                })
            }
        } else {
            response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    item: invite,
                }),
            }
        }
    } catch(e) {
        console.log('Error:', e);
        response = {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: e,
            })
        };
    } finally {
        return response;
    }
};
