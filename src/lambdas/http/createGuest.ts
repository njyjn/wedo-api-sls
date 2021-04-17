// import * as middy from 'middy';
// import { cors } from 'middy/middlewares';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { inviteExists } from 'src/logic/invites';
import { createGuest } from 'src/logic/guests';

// export const handler = middy(
//     async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    let response;

    try {
        const userId = event.requestContext.authorizer.principalId;       
        const newGuest = JSON.parse(event.body);
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
            const newItem = await createGuest(inviteId, newGuest); 
            response = {
                statusCode: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    newItem
                }),
            };
        }
    } catch(e) {
        response = {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: e
            }),
        };
    } finally {
        return response;
    };
};

// handler.use(
//     cors({
//         credentials: true,
//     })
// );
