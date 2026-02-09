import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(__dirname, '../../../../../public/icons');

export function setIconCommand(client, channel, message, tags, db) {
    if (!message.startsWith('!icon set')) return;

    const parts = message.split(' ');
    if (`${parts[0]} ${parts[1]}` !== '!icon set') return;

    const iconName = parts[2];
    if (!iconName) {
        client.say(channel, 'You need to provide an icon name!');
        return;
    }

    // 🔽 read available icons from folder
    const files = fs.readdirSync(ICONS_DIR);

    const validIcons = new Set(
        files
            .filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
            .map(f => path.parse(f).name.toLowerCase())
    );

    if (!validIcons.has(iconName.toLowerCase())) {
        client.say(
            channel,
            `Invalid icon. Available: ${[...validIcons].slice(0, 10).join(', ')}`
        );
        return;
    }

    const row = db
        .prepare(`SELECT icon FROM twitch_users WHERE username = ?`)
        .get(tags.username);

    if (!row) {
        db.prepare(`
            INSERT INTO twitch_users (username, icon)
            VALUES (?, ?)
        `).run(tags.username, iconName);
    } else {
        db.prepare(`
            UPDATE twitch_users
            SET icon = ?
            WHERE username = ?
        `).run(iconName, tags.username);
    }

    client.say(channel, `${tags.username} set ${iconName} as icon.`);
    return true;
}
