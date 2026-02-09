<template>
    <div class="configuration p-5 min-h-screen" style="font-family: 'Space Mono', sans-serif">
        <h1 class="text-2xl mb-4">Configuration</h1>

        <!-- Step 1: Enter Channel Name and Client ID -->
        <div class="mb-3 flex flex-col">
            <label>Channel Name</label>
            <input v-model="channelName" class="border p-2 rounded" />
        </div>

        <div class="mb-3 flex flex-col">
            <label>Client ID</label>
            <input v-model="clientId" class="border p-2 rounded" />
        </div>

        <button
            class="cursor-pointer hover:bg-neutral-300 border border-black p-3 rounded mb-6"
            @click="saveSettings"
        >
            Save Settings
        </button>

        <!-- Confirmation message after saving -->
<!--        <div v-if="saved" class="text-green-600 mb-4">Settings saved successfully!</div>-->

        <!-- Step 2: Show OAuth / Test message section only if saved -->
        <div v-if="saved">
            <div v-if="!tokenExists">
                <div class="mb-2">OAuth Token does not exist. Please click the button below.</div>
                <button
                    @click="startOAuth"
                    class="cursor-pointer hover:bg-neutral-300 border border-black p-3 rounded"
                >
                    Fetch OAuth Token
                </button>
            </div>

            <div v-else>
                <div class="mb-2" v-if="connected">Bot connected to channel: {{ channelName }}</div>
                <button class="cursor-pointer hover:bg-neutral-300 border border-black p-3 mb-6 rounded" @click="sendTestMessage">Send Test Message</button>
                <div class="mb-2">OAuth Token already stored. <span class="text-red-500">DON'T SHOW TO ANYONE.</span></div>
                <div>
                    <button class="cursor-pointer hover:bg-neutral-300 border border-black p-3 mb-6 rounded" @click="showOauth = !showOauth">Show Token</button>
                    <span v-if="showOauth" class="">{{ oauthToken }}</span>
                </div>
                <div class="mb-2">If you want to replace the token, click the button below.</div>
                <button
                    @click="startOAuth"
                    class="cursor-pointer hover:bg-neutral-300 border border-black p-3 mb-6 rounded"
                >
                    Fetch New OAuth Token
                </button>
            </div>
        </div>

        <div>
            <p v-if="error" class="text-red-500">{{ error }}</p>
        </div>
    </div>
</template>

<script>
import tmi from 'tmi.js';
import {onMounted, ref} from 'vue';

export default {
    name: 'Configuration',
    setup: function () {
        const oauthToken = ref('');
        const client = ref(null);
        const connected = ref(false);
        const channelName = ref('');
        const error = ref('');
        const tokenExists = ref(false);
        const showOauth = ref(false);
        const saved = ref(false); // track if settings were saved

        const clientId = ref('');
        const VITE_TWITCH_REDIRECT_URL = import.meta.env.VITE_TWITCH_REDIRECT_URL;
        const SCOPES = ['chat:read', 'chat:edit', 'channel:bot'];

        onMounted(async () => {
            await loadSettingFromDb('channel_name');
            await loadSettingFromDb('client_id');
            await loadSettingFromDb('twitch_oauth');

            checkTokenInUrl();

            if(channelName.value && clientId.value) {
                saved.value = true;
            }
        });

        const saveSettings = async () => {
            if (!channelName.value || !clientId.value) {
                error.value = "Please fill Channel Name and Client ID first.";
                return;
            }

            try {
                // Save channel name
                await fetch('/api/configuration/save-setting', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
                    body: JSON.stringify({ name: 'channel_name', value: channelName.value }),
                });

                // Save client ID
                await fetch('/api/configuration/save-setting', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
                    body: JSON.stringify({ name: 'client_id', value: clientId.value }),
                });

                // Show confirmation and enable next steps
                saved.value = true;
                error.value = '';
            } catch (err) {
                console.error(err);
                error.value = 'Failed to save settings.';
            }
        };

        const loadSettingFromDb = async (name) => {
            try {
                const res = await fetch(`/api/configuration/${name}`);
                const data = await res.json();

                if (data.value) {
                    if (name === 'twitch_oauth') {
                        console.log(data.value);
                        oauthToken.value = data.value.replace(/^oauth:/, '');
                        tokenExists.value = true;
                        initTmiClient(oauthToken.value);
                    } else if (name === 'channel_name') {
                        channelName.value = data.value;
                    } else if (name === 'client_id') {
                        clientId.value = data.value;
                    } else {
                        console.error(`Invalid setting name: ${name}`);
                    }
                }
            } catch (err) {
                console.error(`Failed to load setting ${name}`, err);
            }
        }

        // Called when the "Fetch OAuth Token" button is clicked
        const startOAuth = () => {
            if (!channelName.value || !clientId.value) {
                error.value = "Please enter Channel Name and Client ID first!";
                return;
            }

            // Clear any previous errors
            error.value = "";

            window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId.value}&redirect_uri=${encodeURIComponent(
                VITE_TWITCH_REDIRECT_URL,
            )}&response_type=token&scope=${SCOPES.join('+')}`;
        };

        const initTmiClient = (token) => {
            if (!channelName.value || !clientId.value) {
                console.error("Cannot initialize TMI client: Channel Name or Client ID missing");
                return;
            }

            if (client.value) return; // prevent double init

            client.value = new tmi.Client({
                options: { debug: true },
                identity: {
                    username: channelName.value,
                    password: `oauth:${token}`,
                },
                channels: [channelName.value],
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
                await fetch('/api/configuration/save-setting', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
                    body: JSON.stringify({name: name, value: `oauth:${token}`}),
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
            showOauth,
            loadSettingFromDb,
            oauthToken,
            tokenExists,
            startOAuth,
            sendTestMessage,
            connected,
            channelName,
            clientId,
            error,
            saved,
            saveSettings
        };
    },
};
</script>

<style scoped>

</style>
