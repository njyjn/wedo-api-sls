export interface Invite {
    userId: string,
    inviteId: string,
    familyName: string,
    type: string,
    qrCodeUrl: string,
    createTs: string,
    responded: boolean,
    attending: boolean,
    attachments?: Set<string>,
}