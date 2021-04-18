import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { respondToInvite } from "src/logic/invites";
import { RespondToInviteRequest } from 'src/requests/RespondToInviteRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    let response;

    try {
        const inviteId = event.pathParameters.inviteId;
        const inviteResponse: RespondToInviteRequest = JSON.parse(event.body);
        await respondToInvite(
            inviteId,
            inviteResponse
        );
        response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: '',
        };
    } catch(e) {
        console.log(e);
        response = {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: e.message
            }),
        };
    } finally {
        return response;
    }
};
