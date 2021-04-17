import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { getGuest } from 'src/logic/guests';
import { inviteExists } from 'src/logic/invites';

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
            const guestId = event.pathParameters.guestId;
            const guest = await getGuest(inviteId, guestId);
            if (!guest) {
                response = {
                    statusCode: 404,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                        error: 'Guest not found'
                    })
                }
            } else {
                response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        item: guest,
                    }),
                }
            }
        }
    } catch(e) {
        console.log('Error in getGuest(): ', e);
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
