export function iconCommand(client, channel, message, tags, db) {
    if (message !== '!icon') return;

    const row = db
        .prepare(`SELECT value FROM settings WHERE name = ?`)
        .get('icon_pdf_link');

    const value = row?.value;

    client.say(
        channel,
        value ? `Available icons: ${value}` : `You can set an icon with "!icon set iconname".`,
    );

    return true;
}
