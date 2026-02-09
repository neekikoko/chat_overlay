<template>
    <div class="chatbot">
        <h2>Configuration</h2>

        <div v-if="!tokenExists">
            <div>OAuth Token already does not exist. Please click the button below.</div>
            <button
                @click="startOAuth"
                class="cursor-pointer"
            >
                Fetch OAuth Token
            </button>
        </div>

        <div v-else>
            <div>OAuth Token already stored: {{ oauthToken }}</div>
            <div>If you want to replace it, click the button below.</div>
            <button
                @click="startOAuth"
                class="cursor-pointer"
            >
                Fetch OAuth Token
            </button>

            <div>
                <button class="cursor-pointer" @click="sendTestMessage">Send Test Message</button>
                <p v-if="connected">Bot connected to channel: {{ channel }}</p>
            </div>
        </div>

        <div>
            <p v-if="error">{{ error }}</p>
        </div>
    </div>
</template>

<script>
import tmi from 'tmi.js';
import {onMounted, ref} from 'vue';

export default {
    name: 'Configuration',
    setup() {
        const oauthToken = ref('');
        const client = ref(null);
        const connected = ref(false);
        const channel = import.meta.env.VITE_TWITCH_CHANNEL;
        const error = ref('');
        const tokenExists = ref(false);

        const CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID;
        const VITE_TWITCH_REDIRECT_URL = import.meta.env.VITE_TWITCH_REDIRECT_URL;
        const SCOPES = ['chat:read', 'chat:edit', 'channel:bot'];

        onMounted(() => {
            checkTokenInUrl();
            loadTokenFromDb();
        });

        const loadTokenFromDb = async () => {
            try {
                const res = await fetch('/api/configuration/oauth-token/twitch_oauth');
                const data = await res.json();

                if (data.token) {
                    oauthToken.value = data.token.replace(/^oauth:/, '');
                    tokenExists.value = true;

                    initTmiClient(oauthToken.value);
                }
            } catch (err) {
                console.error('Failed to load token from DB', err);
            }
        };

        // Called when the "Fetch OAuth Token" button is clicked
        const startOAuth = () => {
            window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
                VITE_TWITCH_REDIRECT_URL,
            )}&response_type=token&scope=${SCOPES.join('+')}`;
        };

        const initTmiClient = (token) => {
            if (client.value) return; // prevent double init

            client.value = new tmi.Client({
                options: { debug: true },
                identity: {
                    username: 'ttschama',
                    password: `oauth:${token}`,
                },
                channels: [channel],
            });

            client.value
                .connect()
                .then(() => {
                    connected.value = true;

                    client.value.on('message', (chan, tags, message, self) => {
                        if (self) return;

                        if (message.toLowerCase() === '!lurk') {
                            client.value.say(chan, `Thank you for lurking, ${tags.username}!`);
                        }
                    });
                })
                .catch((err) => {
                    console.error(err);
                    error.value = 'Failed to connect bot';
                });
        };

        // Check if OAuth token exists in URL fragment
        const checkTokenInUrl = () => {
            const hash = window.location.hash; // e.g. #access_token=xxxx&scope=chat:read+chat:edit
            if (hash.includes('access_token=')) {
                const params = new URLSearchParams(hash.replace('#', '?'));

                oauthToken.value = params.get('access_token');
                saveTokenToDb(oauthToken.value, 'twitch_oauth');

                // Remove token from URL for cleanliness
                window.history.replaceState({}, document.title, window.location.pathname);

                initTmiClient(oauthToken.value);

                client.value
                    .connect()
                    .then(() => {
                        connected.value = true;

                        // Add !lurk command listener
                        client.value.on('message', (chan, tags, message, self) => {
                            if (self) return; // Ignore bot's own messages

                            const msg = message.toLowerCase();

                            if (msg === '!lurk') {
                                client.value.say(chan, `Thank you for lurking, ${tags.username}!`);
                            }
                        });
                    })
                    .catch((err) => {
                        console.error(err);
                        error.value = 'Failed to connect bot';
                    });
            }
        };

        const saveTokenToDb = async (token, name) => {
            try {
                await fetch('/chat-bot/save-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
                    body: JSON.stringify({ token: `oauth:${token}`, name: name }),
                });
            } catch (err) {
                console.error('Failed to save token:', err);
            }
        };

        const sendTestMessage = async () => {
            console.log(client.value, connected.value);

            if (!client.value || !connected.value) return;
            try {
                await client.value.say(channel, 'Test message from chat overlay bot!');
            } catch (err) {
                console.error(err);
                error.value = 'Failed to send message';
            }
        };

        onMounted(() => {
            checkTokenInUrl();
        });

        return {
            loadTokenFromDb,
            oauthToken,
            tokenExists,
            startOAuth,
            sendTestMessage,
            connected,
            channel,
            error,
        };
    },
};
</script>

<style scoped>

</style>
