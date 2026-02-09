import path from 'path';
import tmi from 'tmi.js';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

import { lurkCommand } from './chat_bot/commands/lurk.js';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env
dotenv.config({
    path: path.resolve(__dirname, '../../../.env'),
});

let CHANNEL = (process.env.VITE_TWITCH_CHANNEL || '').trim();

const BOT_USERNAME = process.env.VITE_TWITCH_CHANNEL;

// Connect to SQLite database
const dbPath = path.join(__dirname, '../../../database/database.sqlite');
const db = new Database(dbPath);

function getToken(name) {
    const row = db.prepare('SELECT token FROM oauth_tokens WHERE name = ?').get(name);
    if (!row) {
        console.error(`No token found for ${name}. Please save it in the database first.`);
        process.exit(1);
    }
    return row.token;
}

const oauthToken = getToken('twitch_oauth');

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
    { name: lurkCommand, async: false },
];

// command handling
client.on('message', async (channel, tags, message, self) => {
    const row = db.prepare(`SELECT icon FROM twitch_users WHERE username = ?`).get(tags.username);

    try {
        await fetch(`${process.env.APP_URL}/api/chatbot/chat-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: tags.username,
                displayName: tags['display-name'],
                color: tags.color,
                badges: tags.badges,
                emotes: tags.emotes,
                icon: row?.icon || '',
                message,
                timestamp: Date.now(),
            }),
        });
    } catch (err) {
        client.say(channel, err);
    }

    if (self) return;

    for (const { name, async: isAsync } of commands) {
        let called;
        if (isAsync) {
            called = await name(client, channel, message, tags, db);
        } else {
            called = name(client, channel, message, tags, db);
        }
        if (called) {
            // client.say(channel, 'DEBUG: ' + name + ' was called.');
            return;
        }
    }
});
