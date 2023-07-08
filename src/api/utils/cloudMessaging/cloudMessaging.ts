import firebaseApp from '../../../firebase/firebaseApp.js';
import { BatchResponse, Message, getMessaging } from 'firebase-admin/messaging';

const messaging = getMessaging(firebaseApp);

export const sendNotification = async function sendNotification(message: Message, dryRun: boolean): Promise<string> {
  try {
    return await messaging.send(message, dryRun);
  } catch (err) {
    throw new Error('Failed to send notification');
  }
};

export const sendNotifications = async function sendNotification(
  messages: Message[],
  dryRun: boolean,
): Promise<BatchResponse> {
  try {
    // sendEach only sends up to 500 messages at a time
    // I need to split the messages into chunks of 500
    const chunks = [];
    const chunkSize = 500;
    // Loop explained: https://stackoverflow.com/a/8495740/1332513
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }
    const responses: BatchResponse = {
      responses: [],
      successCount: 0,
      failureCount: 0,
    };
    for (const chunk of chunks) {
      const batchRes = await messaging.sendEach(chunk, dryRun);
      responses.responses.push(...batchRes.responses);
      responses.successCount += batchRes.successCount;
      responses.failureCount += batchRes.failureCount;
    }
    return responses;
  } catch (err) {
    throw new Error('Failed to send notification');
  }
};
