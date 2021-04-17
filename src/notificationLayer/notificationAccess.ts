import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

const XAWS = AWSXRay.captureAWS(AWS);

const awsRegion = process.env.AWS_REGION;
const awsAccountId = process.env.AWS_ACCOUNT_ID;

export class NotificationAccess {
    
    constructor(
        private readonly snsClient: AWS.SNS = createSnsClient(),
        private readonly topicName: string = process.env.GENERIC_TOPIC_NAME,
    ) {}


    async publishToSns(message: any, topicName?: string): Promise<void> {
        const topic = topicName || this.topicName;
        const snsParams = {
            Message: JSON.stringify({
                ...message,
            }),
            TopicArn: `arn:aws:sns:${awsRegion}:${awsAccountId}:${topic}`,
            MessageAttributes: {
                channel: {
                    DataType: 'String',
                    StringValue: 'generateQrCode'
                }
            }
        }
        await this.snsClient.publish(snsParams).promise();
    }
}

function createSnsClient(): AWS.SNS {
    if (!process.env.IS_OFFLINE) {
        return new XAWS.SNS();
    }
    return new AWS.SNS();
}