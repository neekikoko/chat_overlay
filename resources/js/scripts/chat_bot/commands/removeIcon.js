export function removeIconCommand(client, channel, message, tags, db) {
    if (message !== '!icon remove') return;

    const row = db.prepare(`SELECT icon FROM twitch_users WHERE username = ?`).get(tags.username);

    if (!row) {
        // first time user → insert
        db.prepare(
            `
            INSERT INTO twitch_users (username)
            VALUES (?)
        `,
        ).run(tags.username);
    } else {
        // existing → update
        db.prepare(
            `
            UPDATE twitch_users
            SET icon = ?
            WHERE username = ?
        `,
        ).run('', tags.username);
    }

    client.say(channel, `${tags.username} removed their icon.`);

    return true;
}
