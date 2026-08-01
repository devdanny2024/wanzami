import admin from "firebase-admin";

const BROADCAST_TOPIC = "broadcast";

let app: admin.app.App | null = null;

function getApp() {
  if (app) return app;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
  app = admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(json)),
  });
  return app;
}

export async function subscribeToBroadcastTopic(tokens: string[]) {
  if (!tokens.length) return;
  await admin.messaging(getApp()).subscribeToTopic(tokens, BROADCAST_TOPIC);
}

export async function unsubscribeFromBroadcastTopic(tokens: string[]) {
  if (!tokens.length) return;
  await admin.messaging(getApp()).unsubscribeFromTopic(tokens, BROADCAST_TOPIC);
}

export async function sendBroadcast(params: { title: string; body: string; imageUrl?: string }) {
  const message: admin.messaging.Message = {
    topic: BROADCAST_TOPIC,
    notification: {
      title: params.title,
      body: params.body,
      ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
    },
  };
  return admin.messaging(getApp()).send(message);
}
