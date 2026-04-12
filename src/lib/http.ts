import ky, { isHTTPError } from 'ky';
import { getVersion } from '@tauri-apps/api/app';
import { fetch } from '@tauri-apps/plugin-http';
import { arch, platform } from '@tauri-apps/plugin-os';
import { defaultClient } from '$lib/constants/clients';
import { EpicAPIError, isEpicAPIError } from '$lib/exceptions/EpicAPIError';
import { Manifest } from '$lib/modules/manifest';
import { settingsStore } from '$lib/storage';

// Used to avoid CORS issues
export const tauriKy = ky.create({
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

const manifest = await Manifest.getFortniteManifest().catch(() => null);
const defaultUserAgent = manifest?.appVersionString
  ? `Fortnite/${manifest.appVersionString.replace('-Windows', '')} Windows/10.0.26100.1.256.64bit`
  : 'Fortnite/++Fortnite+Release-40.10-CL-52157884 Windows/10.0.26100.1.256.64bit';

let userAgent = defaultUserAgent;

settingsStore.subscribe((settings) => {
  userAgent = settings.app?.userAgent || defaultUserAgent;
});

export const epicService = tauriKy.extend({
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        if (!request.headers.has('X-User-Agent')) {
          request.headers.set('X-User-Agent', userAgent);
        }
      }
    ],
    beforeError: [
      async ({ error }) => {
        if (!isHTTPError(error) || !isEpicAPIError(error.data)) return error;
        return new EpicAPIError(error.data);
      }
    ]
  }
});

export const baseGameService = epicService.extend({
  prefix: 'https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/game/v2'
});

export const friendService = epicService.extend({
  prefix: 'https://friends-public-service-prod.ol.epicgames.com/friends/api/v1'
});

export const fulfillmentService = epicService.extend({
  prefix: 'https://fulfillment-public-service-prod.ol.epicgames.com/fulfillment/api/public'
});

export const lightswitchService = epicService.extend({
  prefix: 'https://lightswitch-public-service-prod.ol.epicgames.com/lightswitch/api/service'
});

export const oauthService = epicService.extend({
  prefix: 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth',
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        if (!request.headers.has('Authorization')) {
          request.headers.set('Authorization', `Basic ${defaultClient.base64}`);
        }

        request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    ]
  }
});

export const partyService = epicService.extend({
  prefix: 'https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite'
});

export const publicAccountService = epicService.extend({
  prefix: 'https://account-public-service-prod.ol.epicgames.com/account/api/public/account'
});

export const eulaService = epicService.extend({
  prefix: 'https://eulatracking-public-service-prod.ol.epicgames.com/eulatracking/api/public/agreements/fn'
});

export const userSearchService = epicService.extend({
  prefix: 'https://user-search-service-prod.ol.epicgames.com/api/v1/search'
});

export const avatarService = epicService.extend({
  prefix: 'https://avatar-service-prod.identity.live.on.epicgames.com/v1/avatar/fortnite'
});

const launcherUA = `SpitfireLauncher/${await getVersion()} (${platform()}; ${arch()})`;

export const spitfireService = tauriKy.extend({
  prefix: 'https://api.rookie-spitfire.xyz',
  headers: {
    'X-User-Agent': launcherUA
  }
});

export const legendaryService = tauriKy.extend({
  prefix: 'https://api.legendary.gl',
  headers: {
    'X-User-Agent': launcherUA
  }
});
