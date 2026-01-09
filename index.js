const { Client, GatewayIntentBits } = require('discord.js');
const admin = require('firebase-admin');

// --- Configuration ---
const botToken = process.env.DISCORD_TOKEN;
const announcementChannelId = '1451311113684779149'; // <-- IMPORTANT: Change this
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// --- Firebase Initialization ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Successfully connected to Firebase.');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  process.exit(1);
}
const db = admin.firestore();

// --- Discord Bot Initialization ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}!`);
  listenForEvents();
});

function listenForEvents() {
  console.log('Listening for new events in the "events" collection...');
  db.collection('events').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      // We only care about brand new documents being added.
      if (change.type === 'added') {
        const newEvent = change.doc.data();
        console.log(`New event detected: ${newEvent.name}`);

        const channel = client.channels.cache.get(announcementChannelId);

        if (channel) {
          // Convert the Firestore Timestamp to a readable JavaScript Date
          const eventTime = newEvent.startTime.toDate();
          
          // Customize your announcement message here!
          const announcementMessage = `📢 **New Event Created!** 📢\n\n**Event:** ${newEvent.name}\n**Details:** ${newEvent.description}\n**When:** ${eventTime.toLocaleString()}`;
          
          channel.send(announcementMessage);
        } else {
          console.error(`Error: Could not find the announcement channel with ID: ${announcementChannelId}`);
        }
      }
    });
  }, error => {
    console.error('Error listening to Firestore snapshot:', error);
  });
}


// --- Bot Login ---
if (botToken) {
  client.login(botToken);
} else {
  console.error('Error: DISCORD_TOKEN is not set. Please set it as a secret/environment variable.');
  process.exit(1);
}
