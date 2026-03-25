import path from 'path';
import tmi from 'tmi.js';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

import { iconCommand } from './chat_bot/commands/icon.js';
import { setIconCommand } from './chat_bot/commands/setIcon.js';
import { removeIconCommand } from './chat_bot/commands/removeIcon.js';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env
dotenv.config({
    path: path.resolve(__dirname, '../../../.env'),
});

// Connect to SQLite database
const dbPath = path.join(__dirname, '../../../database/database.sqlite');
const db = new Database(dbPath);

function getSetting(name) {
    const row = db.prepare('SELECT value FROM settings WHERE name = ?').get(name);
    if (!row) {
        console.error(`No token found for ${name}. Please save it in the database first.`);
        process.exit(1);
    }
    return row.value;
}

let CHANNEL = getSetting('channel_name');

const BOT_USERNAME = CHANNEL;

const oauthToken = getSetting('twitch_oauth');

// create tmi client
const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: BOT_USERNAME,
        password: oauthToken,
    },
    channels: [CHANNEL],
});

client
    .connect()
    .then(() => {
        console.log(`Bot connected to ${CHANNEL}`);
        client.say(CHANNEL, `I'm ready`);
    })
    .catch(console.error);

client.on('join', (_, username, self) => {});

client.on('part', (_, username) => {});

const commands = [
    { name: iconCommand, async: false },
    { name: setIconCommand, async: false },
    { name: removeIconCommand, async: false },
];

// command handling
client.on('message', async (channel, tags, message, self) => {
    // Use fallback for bot messages
    const username = tags.username || BOT_USERNAME;

    // Check if user exists in DB
    let user = db.prepare(`SELECT icon FROM twitch_users WHERE username = ?`).get(username);

    // Only insert real Twitch users, not the bot
    if (!user && username !== BOT_USERNAME) {
        db.prepare(`INSERT INTO twitch_users (username, icon) VALUES (?, ?)`).run(username, '');
        user = db.prepare(`SELECT icon FROM twitch_users WHERE username = ?`).get(username);
        console.log(`Created new user: ${username}`);
    }

    // Send to overlay API
    try {
        await fetch(`${process.env.APP_URL}/api/chatbot/chat-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                displayName: tags['display-name'] || username,
                color: tags.color,
                badges: tags.badges,
                emotes: tags.emotes,
                icon: user?.icon || '',
                message,
                timestamp: Date.now(),
            }),
        });
    } catch (err) {
        client.say(channel, `Error sending message: ${err.message}`);
    }

    // ignore bot messages for commands
    if (self) return;

    // Run commands
    for (const {name, async: isAsync} of commands) {
        if (isAsync) {
            await name(client, channel, message, tags, db);
        } else {
            name(client, channel, message, tags, db);
        }
    }
});
