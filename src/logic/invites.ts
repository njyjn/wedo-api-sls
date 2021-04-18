import { Invite } from 'src/models/Invite';
import { InviteAccess } from 'src/dataLayer/inviteAccess';
import { NotificationAccess } from 'src/notificationLayer/notificationAccess';
import { CreateInviteRequest } from 'src/requests/CreateInviteRequest';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import axios from 'axios';
import { DocustoreAccess } from 'src/fsLayer/docustoreAccess';
import { UpdateInviteRequest } from 'src/requests/UpdateInviteRequest';

const bucketName = process.env.DOCUSTORE_S3_BUCKET;

const inviteAccess = new InviteAccess();
const notificationAccess = new NotificationAccess();
const docustoreAccess = new DocustoreAccess();

export async function getAllInvites(userId: string, limit?: number, key?: string): Promise<[Invite[], any]> {
    return inviteAccess.getAllInvites(userId, limit, key);
};

export async function getInvite(userId: string, inviteId: string): Promise<Invite> {
    return inviteAccess.getInvite(userId, inviteId);
}

export async function createInvite(userId: string, createInviteRequest: CreateInviteRequest): Promise<Invite> {
    const qrCodeUrlBase = `https://${bucketName}.s3.amazonaws.com`;
    const inviteId = uuidv4().substring(30).toUpperCase();
    return await inviteAccess.createInvite({
        inviteId: inviteId,
        userId: userId,
        qrCodeUrl: `${qrCodeUrlBase}/invite_qr_codes/${userId}/${inviteId}.png`,
        familyName: createInviteRequest.familyName,
        type: createInviteRequest.type,
        createTs: new Date().toISOString(),
        responded: false,
        attending: false,
    });
};

export async function updateInvite(userId: string, inviteId: string, updateInviteRequest: UpdateInviteRequest): Promise<Invite> {
    return await inviteAccess.updateInvite(userId, inviteId, updateInviteRequest) as Invite;
};

export async function deleteInvite(userId: string, inviteId: string): Promise<void> {
    return await inviteAccess.deleteInvite(userId, inviteId);
};

export async function inviteExists(userId: string, inviteId: string): Promise<boolean> {
    return await inviteAccess.inviteExists(userId, inviteId);
}

export async function getUploadUrl(userId: string, id: string) {
    return await docustoreAccess.getUploadUrl(userId, id, bucketName);
}

export async function queueGenerateQrCode(userId: string, inviteId: string): Promise<void> {
    return await notificationAccess.publishToSns({
        inviteId: inviteId,
        userId: userId,
    });
}

export async function generateQrCode(inviteId: string, uploadUrl:string): Promise<void> {
    try {
        const buffer = await QRCode.toBuffer(inviteId);
        console.log('QR code generated for invite ', inviteId);
        await uploadQrCode(buffer, inviteId, uploadUrl);
    } catch (err) {
        throw new Error(err);
    }
}

async function uploadQrCode(buffer: Buffer, inviteId: string, uploadUrl: string): Promise<void> {
    await axios.put(
        uploadUrl,
        buffer,
        { 
            headers: {
                'Content-Type': 'image/png'
            }
        }
    ).then(() => {
        console.log('QR code uploaded for invite ', inviteId);
    }).catch(err => {
        throw new Error(err);
    });
};
