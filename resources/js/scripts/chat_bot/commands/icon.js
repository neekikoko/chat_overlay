export function iconCommand(client, channel, message, tags, db) {
    if (message !== '!icon') return;
    client.say(
        channel,
        `WIP`,
    );

    return true;
}
