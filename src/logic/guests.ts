import { Guest } from 'src/models/Guest';
import { GuestAccess } from 'src/dataLayer/guestAccess';
import { CreateGuestRequest } from 'src/requests/CreateGuestRequest';

const guestAccess = new GuestAccess();

export async function getGuestsInInvite(inviteId: string, limit?: string, nextKey?: string): Promise<[Guest[], any]> {
    return await guestAccess.getGuestsInInvite(
        inviteId,
        parseInt(limit),
        nextKey
    )
}

export async function createGuest(inviteId: string, createGuestRequest: CreateGuestRequest): Promise<Guest> {
    return await guestAccess.createGuest({
        inviteId: inviteId,
        fullName: createGuestRequest.fullName,
        guestId: createGuestRequest.guestId,
        createTs: new Date().toISOString(),
    } as Guest)
}

export async function getGuest(inviteId: string, guestId: string): Promise<Guest> {
    return await guestAccess.getGuest(inviteId, guestId);
}
