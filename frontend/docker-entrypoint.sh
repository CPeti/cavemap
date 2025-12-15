#!/bin/sh

# Generate runtime config from environment variables
# This allows configuration to be injected at container startup via Kubernetes

cat > /usr/share/nginx/html/config.js << EOF
window.__CONFIG__ = {
    API_BASE_URL: "${API_BASE_URL:-https://localhost.me}"
};
EOF

# Start nginx
exec nginx -g 'daemon off;'

