const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const db = admin.firestore();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendSmsOnNewNotification = onDocumentCreated(
  "users/{uid}/notifications/{notificationId}",
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.error("No notification data found.");
        return;
      }

      const notification = snapshot.data();
      const uid = event.params.uid;

      const profileRef = db.doc(`users/${uid}/profile/info`);
      const profileSnap = await profileRef.get();

      if (!profileSnap.exists) {
        logger.warn(`No profile found for uid: ${uid}`);
        return;
      }

      const profile = profileSnap.data();
      const phoneNumber = profile.phoneNumber;
      const smsEnabled = profile.smsEnabled;

      if (!smsEnabled) {
        logger.info(`SMS disabled for uid: ${uid}`);
        return;
      }

      if (!phoneNumber) {
        logger.warn(`No phone number for uid: ${uid}`);
        return;
      }

      const title = notification.title || "New Notification";
      const description = notification.description || "";
      const type = notification.type || "system";

      const body = `[${type.toUpperCase()}] ${title}\n${description}`;

      const message = await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      logger.info(`SMS sent successfully. SID: ${message.sid}`);
    } catch (error) {
      logger.error("Failed to send SMS:", error);
    }
  }
);