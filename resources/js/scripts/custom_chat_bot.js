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

let CHANNEL = (process.env.TWITCH_CHANNEL || '').trim();

const BOT_USERNAME = process.env.TWITCH_BOT_USERNAME;

// Connect to SQLite database
const dbPath = path.join(__dirname, '../../../database/database.sqlite');
const db = new Database(dbPath);

const oauthToken = process.env.TWITCH_OAUTH_TOKEN;

const activeViewers = new Map();

// create tmi client
const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: BOT_USERNAME,
        password: oauthToken,
    },
    channels: [CHANNEL],
});

// establish client connection
client
    .connect()
    .then(() => {
        console.log(`Bot connected to ${CHANNEL}`);
        client.say(CHANNEL, `I'm ready` + (CHANNEL !== 'neekiko' ? ` and in ${MODE} mode!` : '!'));
    })
    .catch(console.error);

client.on('join', (_, username, self) => {
    if (!self) activeViewers.set(username, Date.now());
});

// remove chatter from active viewer list if "part" event is received
client.on('part', (_, username) => {
    activeViewers.delete(username);
});

const commands = [
    { name: lurkCommand, async: false },
];

// command handling
client.on('message', async (channel, tags, message, self) => {

    const row = db.prepare(`SELECT icon FROM twitch_users WHERE username = ?`).get(tags.username);

    try {
        await fetch('http://localhost:8000/api/chatbot/chat-message', {
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
        console.log(err);
    }

    activeViewers.set(tags.username, Date.now());

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

// remove inactive viewers from active viewers list
setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 15 * 60 * 1000; // 5 minutes

    for (const [username, lastSeen] of activeViewers.entries()) {
        if (now - lastSeen > TIMEOUT) {
            activeViewers.delete(username);
        }
    }
}, 60 * 1000);
