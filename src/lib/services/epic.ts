import { defaultClient } from '$lib/constants/clients';
import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
import { Manifest } from '$lib/modules/manifest';
import { tauriKy } from '$lib/services/tauri-ky';
import type { EpicAPIErrorData } from '$types/game/authorizations';
import { getVersion } from '@tauri-apps/api/app';
import { arch, platform } from '@tauri-apps/plugin-os';
import { isHTTPError } from 'ky';

const manifest = await Manifest.getFortniteManifest().catch(() => null);
const userAgent = manifest?.appVersionString
  ? `Fortnite/${manifest.appVersionString}`
  : 'Fortnite/++Fortnite+Release-39.30-CL-49874243-Windows';

export const epicService = tauriKy.extend({
  headers: {
    'X-User-Agent': userAgent
  },
  hooks: {
    beforeError: [
      async (error) => {
        if (!isHTTPError(error) || !(new URL(error.request.url).hostname.endsWith('epicgames.com'))) return error;

        const data = await error.response.json();
        if (!isEpicApiError(data)) return error;

        throw new EpicAPIError(data, error.request, error.response.status);
      }
    ]
  }
});

export const baseGameService = epicService.extend({
  prefixUrl: 'https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/game/v2'
});

export const friendService = epicService.extend({
  prefixUrl: 'https://friends-public-service-prod.ol.epicgames.com/friends/api/v1'
});

export const fulfillmentService = epicService.extend({
  prefixUrl: 'https://fulfillment-public-service-prod.ol.epicgames.com/fulfillment/api/public'
});

export const lightswitchService = epicService.extend({
  prefixUrl: 'https://lightswitch-public-service-prod.ol.epicgames.com/lightswitch/api/service'
});

export const matchmakingService = epicService.extend({
  prefixUrl: 'https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/matchmaking/session'
});

export const oauthService = epicService.extend({
  prefixUrl: 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth',
  hooks: {
    beforeRequest: [
      async (request) => {
        if (!request.headers.has('Authorization')) {
          request.headers.set('Authorization', `Basic ${defaultClient.base64}`);
        }

        request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    ]
  }
});

export const partyService = epicService.extend({
  prefixUrl: 'https://party-service-prod.ol.epicgames.com/party/api/v1/Fortnite'
});

export const publicAccountService = epicService.extend({
  prefixUrl: 'https://account-public-service-prod.ol.epicgames.com/account/api/public/account'
});

export const eulaService = epicService.extend({
  prefixUrl: 'https://eulatracking-public-service-prod.ol.epicgames.com/eulatracking/api/public/agreements/fn'
});

export const userSearchService = epicService.extend({
  prefixUrl: 'https://user-search-service-prod.ol.epicgames.com/api/v1/search'
});

export const avatarService = epicService.extend({
  prefixUrl: 'https://avatar-service-prod.identity.live.on.epicgames.com/v1/avatar/fortnite/ids'
});

export const spitfireService = tauriKy.extend({
  prefixUrl: 'https://api.rookie-spitfire.xyz',
  headers: {
    'X-User-Agent': `SpitfireLauncher/${await getVersion()} (${platform()}; ${arch()})`
  }
});

function isEpicApiError(data: any): data is EpicAPIErrorData {
  return (data as EpicAPIErrorData)?.errorCode !== undefined;
}
