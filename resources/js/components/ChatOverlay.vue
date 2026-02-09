<script>
import Echo from 'laravel-echo';

export default {
    props: {
        layoutMode: {
            type: String,
            default: 'default',
        },
    },
    data() {
        return {
            messages: [],
            echo: null,
            channel: null,

            sevenTvEmotes: {},
            ttsChamaSevenTvEmotes: {},
            enable7tv: false,

            badgeMap: {},
        };
    },

    mounted() {
        this.echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
            wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
            scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
            forceTLS: false,
            disableStats: true,
        });

        this.channel = this.echo.channel('chat');

        this.channel.listen('.new-chat', (e) => {
            const msg = e.message ?? e;

            this.messages.push(msg);

            this.$nextTick(() => {
                this.scrollToBottom();
            });
        });

        if (this.enable7tv) {
            this.load7tvEmotes();
        }
    },

    unmounted() {
        if (this.channel) {
            this.channel.stopListening('.new-chat');
            this.echo.leaveChannel('chat');
        }
    },

    methods: {
        escapeHtml(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        },

        scrollToBottom() {
            const el = this.$refs.chatContainer;
            if (!el) return;

            el.scrollTop = el.scrollHeight;
        },

        async load7tvEmotes() {
            const res = await fetch(`https://7tv.io/v3/users/twitch/${import.meta.env.VITE_TWITCH_BROADCASTER_ID}`);
            const data = await res.json();

            const emotes = {};
            for (const emote of data.emote_set.emotes) {
                emotes[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/4x.webp`;
            }

            this.sevenTvEmotes = emotes;
        },

        renderIcon(msg) {
            let icon = msg.icon?.trim() || 'default.png';

            let classes;
            let style = `outline-color: ${msg.color}`;

            if (this.layoutMode === 'big-icons') {
                classes = 'mr-[2rem] min-h-[19.2rem] min-w-[19.2rem] h-[19.2rem] w-[19.2rem] rounded-[0.5rem] outline-[0.4rem]';
            } else {
                classes = 'mr-[2rem] min-h-[7rem] min-w-[7rem] h-[7rem] w-[7rem] rounded-[0.5rem] outline-[0.4rem]';
            }

            // build local path
            const src = `/icons/${icon}`;

            // fallback to default if file missing
            return `<img class="${classes}" style="${style}" src="${src}" onerror="this.onerror=null;this.src='/icons/default.png';">`;
        },

        renderMessage(msg) {
            const message = msg.message ?? '';
            const parts = [];
            let cursor = 0;

            // ---- Twitch emotes (position-based) ----
            if (msg.emotes) {
                const replacements = [];

                Object.entries(msg.emotes).forEach(([id, positions]) => {
                    positions.forEach((pos) => {
                        const [start, end] = pos.split('-').map(Number);

                        const emoteOnly = !message.includes(' ');
                        const classes =
                            this.layoutMode === 'big-icons'
                                ? emoteOnly
                                    ? 'pt-[1rem] h-[13rem]'
                                    : 'my-[-3rem] h-[7rem]'
                                : emoteOnly
                                  ? 'pt-[1rem] h-[20rem]'
                                  : 'my-[-3rem] h-[7rem]';

                        replacements.push({
                            start,
                            end,
                            html: `<img class="inline-block ${classes}" src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0">`,
                        });
                    });
                });

                // sort left → right
                replacements.sort((a, b) => a.start - b.start);

                for (const r of replacements) {
                    if (r.start < cursor) continue;

                    // text before emote (ESCAPED)
                    parts.push(this.escapeHtml(message.slice(cursor, r.start)));

                    // emote HTML (SAFE)
                    parts.push(r.html);

                    cursor = r.end + 1;
                }
            }

            // remaining text (ESCAPED)
            parts.push(this.escapeHtml(message.slice(cursor)));

            let text = parts.join('');

            // ---- 7TV emotes (name-based) ----
            if (this.enable7tv) {
                text = text
                    .split(' ')
                    .map((word) => {
                        const clean = word.replace(/[^\w]/g, '');
                        if (this.sevenTvEmotes[clean]) {
                            const emoteOnly = !message.includes(' ');
                            const classes =
                                this.layoutMode === 'big-icons'
                                    ? emoteOnly
                                        ? 'pt-[1rem] h-[13rem]'
                                        : 'my-[-3rem] h-[7rem]'
                                    : emoteOnly
                                      ? 'pt-[1rem] h-[20rem]'
                                      : 'my-[-3rem] h-[7rem]';

                            return `<img class="inline-block ${classes}" src="${this.sevenTvEmotes[clean]}">`;
                        }
                        return word;
                    })
                    .join(' ');
            }

            return text;
        },
    },
};
</script>

<template>
    <div v-if="layoutMode === 'default'" class="flex min-h-screen flex-col justify-end text-white bg-black">
        <div ref="chatContainer" class="d-inline max-h-screen overflow-hidden p-[1.5rem]" style="font-family: 'Space Mono', sans-serif">
            <div v-for="(msg, i) in messages" :key="i" class="mt-[3.5rem]">
                <div class="flex items-center text-[4.5rem]" :style="{ color: msg.color || '#aaa' }">
                    <!--<div v-html="renderBadges(msg)" class="flex"></div>-->
                    <div class="z-2 flex items-center">
                        <span v-html="renderIcon(msg)"></span>
                        <span>{{ msg.displayName }}:</span>
                    </div>
                </div>

                <div style="word-break: break-word" class="text-[4.5rem] leading-25" v-html="renderMessage(msg)"></div>
            </div>
        </div>
    </div>

    <div v-if="layoutMode === 'big-icons'" class="flex min-h-screen flex-col justify-end text-white bg-black">
        <div ref="chatContainer" class="d-inline max-h-screen overflow-hidden p-[1.5rem]" style="font-family: 'Space Mono', sans-serif">
            <div v-for="(msg, i) in messages" :key="i" class="clearfix mt-[3.5rem]">
                <div class="float-left" v-html="renderIcon(msg)"></div>

                <div>
                    <div class="text-[4.5rem]" :style="{ color: msg.color || '#aaa' }">
                        <!--<div v-html="renderBadges(msg)" class="flex"></div>-->
                        <div class="">
                            <span>{{ msg.displayName }}:</span>
                        </div>
                    </div>

                    <div style="word-break: break-word" class="text-[4.5rem] leading-25" v-html="renderMessage(msg)"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.clearfix::after {
    content: '';
    display: table;
    clear: both;
}
</style>
