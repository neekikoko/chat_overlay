<template>
    <div class="chatbot">
        <h2>Simple Twitch Chat Bot</h2>

        <div>
            <button @click="startOAuth('oauth_neek')">Fetch OAuth Token for Neekiko</button>
            <p v-if="oauthTokenNeek">OAuth Token for Neekiko: {{ oauthTokenNeek }}</p>
        </div>

        <div>
            <button @click="startOAuth('oauth_chama')">Fetch OAuth Token for TTS-Chama</button>
            <p v-if="oauthTokenChama">OAuth Token for TTS-Chama: {{ oauthTokenChama }}</p>
        </div>

        <div style="margin-top: 20px">
            <button @click="sendTestMessage" :disabled="!connected">Send Test Message</button>
            <p v-if="connected">Bot connected to channel: {{ channel }}</p>
        </div>

        <div style="margin-top: 20px">
            <p v-if="error" style="color: red">{{ error }}</p>
        </div>
    </div>
</template>

<script>
import tmi from 'tmi.js';
import { onMounted, ref } from 'vue';

export default {
    name: 'ChatBot',
    setup() {
        const oauthTokenNeek = ref('');
        const oauthTokenChama = ref('');
        const client = ref(null);
        const connected = ref(false);
        const channel = 'neekiko';
        const error = ref('');

        const CLIENT_ID_NEEK = import.meta.env.VITE_TWITCH_CLIENT_ID_NEEKIKO;
        const CLIENT_ID_CHAMA = import.meta.env.VITE_TWITCH_CLIENT_ID_TTSCHAMA;
        const REDIRECT_URI = 'http://localhost:8000/chat-bot';
        const SCOPES = ['chat:read', 'chat:edit', 'moderator:read:followers', 'channel:bot'];

        // Called when the "Fetch OAuth Token" button is clicked
        const startOAuth = (token_name) => {
            localStorage.setItem('token_name', token_name);
            const clientId = token_name === 'oauth_neek' ? CLIENT_ID_NEEK : CLIENT_ID_CHAMA;
            const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
                REDIRECT_URI,
            )}&response_type=token&scope=${SCOPES.join('+')}`;
            window.location.href = authUrl;
        };

        // Check if OAuth token exists in URL fragment
        const checkTokenInUrl = () => {
            const hash = window.location.hash; // e.g. #access_token=xxxx&scope=chat:read+chat:edit
            if (hash.includes('access_token=')) {
                const params = new URLSearchParams(hash.replace('#', '?'));

                if (localStorage.getItem('token_name') === 'oauth_neek') {
                    oauthTokenNeek.value = params.get('access_token');
                    saveTokenToDb(oauthTokenNeek.value, 'oauth_neek');
                } else {
                    oauthTokenChama.value = params.get('access_token');
                    saveTokenToDb(oauthTokenChama.value, 'oauth_chama');
                }

                // Save token in the database

                // Remove token from URL for cleanliness
                window.history.replaceState({}, document.title, window.location.pathname);

                // Initialize tmi.js client
                client.value = new tmi.Client({
                    options: { debug: true },
                    identity: {
                        username: 'ttschama',
                        password: `oauth:${oauthToken.value}`,
                    },
                    channels: [channel],
                });

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
            if (!client.value || !connected.value) return;
            try {
                await client.value.say(channel, 'Test message from TTS-chama!');
            } catch (err) {
                console.error(err);
                error.value = 'Failed to send message';
            }
        };

        onMounted(() => {
            checkTokenInUrl();
        });

        return {
            oauthTokenNeek,
            oauthTokenChama,
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
.chatbot {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    width: 400px;
}
button {
    padding: 10px 20px;
    cursor: pointer;
}
</style>
