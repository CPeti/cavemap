#!/bin/sh

# Translate API_BASE_URL to VITE_API_BASE_URL for Vite dev server
# This allows the same env var name to be used in both dev and production

if [ -n "$API_BASE_URL" ]; then
    export VITE_API_BASE_URL="$API_BASE_URL"
fi

# Start Vite dev server
exec npm run dev -- --port 80 --host 0.0.0.0

