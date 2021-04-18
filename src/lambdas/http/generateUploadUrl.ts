import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUploadUrl, inviteExists } from 'src/logic/invites';

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
            const fileName = JSON.parse(event.body).fileName;
            const uploadPath = `invite_attachments/${userId}/${inviteId}/${fileName}`;
            const signedUrl = await getUploadUrl(userId, inviteId, uploadPath);
            response = {
                statusCode: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    uploadUrl: signedUrl 
                })
            }
        }
    } catch (e) {
        console.log('Error: ', e);
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
}