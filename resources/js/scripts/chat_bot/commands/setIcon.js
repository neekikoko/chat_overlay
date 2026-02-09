import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your icons folder
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

    // Map lowercase name → full filename (with extension)
    const validIconsMap = new Map(
        files
            .filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
            .map(f => [path.parse(f).name.toLowerCase(), f])
    );

    if (!validIconsMap.has(iconName.toLowerCase())) {
        client.say(
            channel,
            `Invalid icon. Available: ${[...validIconsMap.keys()].slice(0, 10).join(', ')}`
        );
        return;
    }

    // Use the full filename (with extension)
    const iconFile = validIconsMap.get(iconName.toLowerCase());

    // Check if user exists in DB
    const row = db
        .prepare(`SELECT icon FROM twitch_users WHERE username = ?`)
        .get(tags.username);

    if (!row) {
        db.prepare(`
            INSERT INTO twitch_users (username, icon)
            VALUES (?, ?)
        `).run(tags.username, iconFile);
    } else {
        db.prepare(`
            UPDATE twitch_users
            SET icon = ?
            WHERE username = ?
        `).run(iconFile, tags.username);
    }

    client.say(channel, `${tags.username} set ${iconName} as icon.`);
    return true;
}
