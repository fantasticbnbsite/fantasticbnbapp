const webpush = require('web-push');
const { existsSync, readFileSync } = require('fs');
const path = require('path');
const vapidKeys = JSON.parse(readFileSync(path.join('./data', 'vapid.json'), 'utf8'));
webpush.setVapidDetails('mailto:suporte@fantasticbnb.app', vapidKeys.publicKey, vapidKeys.privateKey);
const pushSub = {
  endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint-for-testing",
  keys: { p256dh: "fake", auth: "fake" }
};
webpush.sendNotification(pushSub, JSON.stringify({title: 'test', body: 'test'}))
  .then(() => console.log('Sent!'))
  .catch(err => console.log('FULL ERROR:', err));
