const webpush = require('web-push');
const { existsSync, readFileSync } = require('fs');
const path = require('path');
const vapidKeys = JSON.parse(readFileSync(path.join('./data', 'vapid.json'), 'utf8'));
webpush.setVapidDetails('mailto:suporte@fantasticbnb.app', vapidKeys.publicKey, vapidKeys.privateKey);
console.log('Keys loaded successfully.');
// Create a fake subscription to see if webpush throws an expected 404/410 rather than a 500 error due to misconfiguration.
const pushSub = {
  endpoint: "https://fcm.googleapis.com/fcm/send/fake-endpoint-for-testing",
  keys: { p256dh: "fake", auth: "fake" }
};
webpush.sendNotification(pushSub, JSON.stringify({title: 'test', body: 'test'}))
  .then(() => console.log('Sent!'))
  .catch(err => console.error('Error (expected for fake endpoint):', err.statusCode, err.body));
