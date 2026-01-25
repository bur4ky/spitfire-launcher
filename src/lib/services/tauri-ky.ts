import ky from 'ky';
import { fetch } from '@tauri-apps/plugin-http';

// Used to avoid CORS issues
export default ky.create({
  timeout: 30_000,
  retry: 0,
  fetch: async (input, init) => {
    return fetch(input, init);
  }
});
