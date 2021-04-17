import * as AWS from "aws-sdk";
import * as AWSXRay from 'aws-xray-sdk';

const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION;

const XAWS = AWSXRay.captureAWS(AWS);

export class DocustoreAccess {
    
    constructor(
        private readonly s3Client: AWS.S3 = createS3Client()
    ) {}

    async getUploadUrl(userId: string, inviteId: string, bucketName: string): Promise<string> {
        return await this.s3Client.getSignedUrlPromise('putObject', {
            Bucket: bucketName,
            Key: `invite_qr_codes/${userId}/${inviteId}.png`,
            Expires: parseInt(signedUrlExpiration),
        });
    };
}

function createS3Client(): AWS.S3 {
    if (!process.env.IS_OFFLINE) {
        return new XAWS.S3({
            signatureVersion: 'v4'
        })
    };
    return new AWS.S3({
        signatureVersion: 'v4'
    });
}