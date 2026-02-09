export function lurkCommand(client, channel, message, tags, db) {
    if (message !== '!lurk') return;
    client.say(channel, `Thank you for lurking, ${tags.username}!`);

    return true;
}
