// Runtime configuration - values are injected at container startup
// Falls back to window.__CONFIG__ (set by entrypoint script) or environment variables

const config = {
    // API base URL (e.g., "https://localhost.me")
    API_BASE_URL: window.__CONFIG__?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://localhost.me',
};

// Convenience getters for common URL patterns
export const getApiUrl = (path) => `${config.API_BASE_URL}/api${path}`;
export const getOAuthUrl = (path) => `${config.API_BASE_URL}/oauth2${path}`;

export default config;

