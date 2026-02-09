export function iconListCommand(client, channel, message, tags, db) {
    if (message !== '!icon list') return;

    client.say(
        channel,
        `WIP`,
    );

    return true;
}
