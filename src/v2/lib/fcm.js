import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

/**
 * Send FCM notification to a topic (event-based notification)
 * @param {string} topic - The topic name (event)
 * @param {object} payload - The notification payload
 * @returns {Promise<object>} FCM response
 */
export async function sendNotificationByEvent(topic, payload) {
  return admin.messaging().sendToTopic(topic, payload);
}

/**
 * Send FCM notification to a device by token
 * @param {string} token - The device FCM token
 * @param {object} payload - The notification payload
 * @returns {Promise<object>} FCM response
 */
export async function sendNotificationByToken(token, payload) {
  return admin.messaging().sendToDevice(token, payload);
}
