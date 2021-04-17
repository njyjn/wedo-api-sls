import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { getAllInvites } from "src/logic/invites";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);
    
    // Parse out optional limit and nextKey query params for pagination
    let limit;
    let nextKey;
    let response;
    try {
        if (event.queryStringParameters) {
            if (event.queryStringParameters.limit) {
                limit = event.queryStringParameters.limit;
            }
            if (event.queryStringParameters.nextKey) {
                nextKey = event.queryStringParameters.nextKey;
            }
        };
        const userId = event.requestContext.authorizer.principalId;
        const [invites, key] = await getAllInvites(userId, limit, nextKey);

        response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                items: invites,
                nextKey: key,
            }),
        };
    } catch(e) {
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
