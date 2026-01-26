import ky from 'ky';
import { fetch } from '@tauri-apps/plugin-http';

// Used to avoid CORS issues
export default ky.create({
  timeout: 30_000,
  retry: 0,
  fetch: async (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (input instanceof Request) {
      for (const [key, value] of input.headers.entries()) {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      }
    }

    // The browser drops the User-Agent header
    // As a workaround we pass it as X-User-Agent and put it back in Tauri's own fetch implementation
    const uaOverride = headers.get('X-User-Agent');
    if (uaOverride) {
      headers.set('User-Agent', uaOverride);
      headers.delete('X-User-Agent');
    }

    init.headers = headers;
    return fetch(input, init);
  }
});
