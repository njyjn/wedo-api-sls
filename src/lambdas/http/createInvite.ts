import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { createGuest } from "src/logic/guests";
import { createInvite, queueGenerateQrCode } from "src/logic/invites";
import { CreateGuestRequest } from "src/requests/CreateGuestRequest";
import { CreateInviteRequest } from 'src/requests/CreateInviteRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    let response;

    try {
        const userId = event.requestContext.authorizer.principalId;
        const newInvite: CreateInviteRequest = JSON.parse(event.body);

        // Create invite
        const invite = await createInvite(
            userId,
            newInvite
        );

        // Queue QR code creation
        await queueGenerateQrCode(userId, invite.inviteId);

        const newGuest = {
            fullName: invite.familyName,
        } as CreateGuestRequest;

        // Create primary guest
        const guest = await createGuest(
            invite.inviteId,
            newGuest
        );

        response = {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                newItem: invite,
                primaryGuest: guest,
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
