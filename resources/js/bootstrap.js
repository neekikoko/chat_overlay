import axios from 'axios';
window.axios = axios;

import { configureEcho } from '@laravel/echo-vue';

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'your-app-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
    forceTLS: false,
    disableStats: true,
});
