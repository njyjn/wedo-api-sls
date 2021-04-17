import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { inviteExists } from 'src/logic/invites';
import { getGuestsInInvite } from 'src/logic/guests';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);
    
    // Parse out optional limit and nextKey query params for pagination
    let limit;
    let nextKey;
    let response;
    try {
        const userId = event.requestContext.authorizer.principalId;
        if (event.queryStringParameters) {
            if (event.queryStringParameters.limit) {
                limit = event.queryStringParameters.limit;
            }
            if (event.queryStringParameters.nextKey) {
                nextKey = event.queryStringParameters.nextKey
            }
        }

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
            const [guests, key] = await getGuestsInInvite(inviteId, limit, nextKey);
            response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    items: guests,
                    nextKey: key,
                }),
            };
        }
    } catch(e) {
        console.log('Error in getGuests(): ', e);
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