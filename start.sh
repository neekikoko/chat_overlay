#!/usr/bin/env bash

set -e

# -------------------------------------------------
# Resolve base path (same as %~dp0)
# -------------------------------------------------
BASEPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASEPATH"

echo "=== Starting services ==="

php artisan queue:work --sleep=0.05 --max-jobs=0 --max-time=0 &
php artisan reverb:start &
php artisan serve --port=8001 &
node resources/js/scripts/custom_chat_bot.js &

wait
