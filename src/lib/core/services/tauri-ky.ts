import { accountsStorage } from '$lib/core/data-storage';
import { accessTokenCache } from '$lib/stores';
import ky, { isHTTPError } from 'ky';
import { fetch } from '@tauri-apps/plugin-http';
import Manifest from '$lib/core/manifest';
import { get } from 'svelte/store';
import { isEpicApiError } from '$lib/utils/util';
import Authentication from '$lib/core/authentication';
import EpicAPIError from '$lib/exceptions/EpicAPIError';

const accessTokenValidationErrors = new Set([
  'errors.com.epicgames.common.authentication.token_verification_failed',
  'errors.com.epicgames.common.oauth.invalid_token'
]);

let userAgent: string;

// Used to avoid CORS issues
const tauriKy = ky.create({
  timeout: 30000,
  fetch: async (input, init = {}) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (!isEpicUrl(url)) {
      return fetch(input, init);
    }

    userAgent ??= await Manifest.getFortniteUserAgent();

    const mergedHeaders = new Headers(init.headers);
    if (input instanceof Request) {
      for (const [key, value] of input.headers.entries()) {
        if (!mergedHeaders.has(key)) {
          mergedHeaders.set(key, value);
        }
      }
    }

    if (!mergedHeaders.has('User-Agent')) {
      mergedHeaders.set('User-Agent', userAgent);
    }

    init.headers = mergedHeaders;
    return fetch(input, init);
  },
  retry: {
    limit: 1,
    shouldRetry: async ({ error }) => {
      if (!isHTTPError(error) || !isEpicUrl(error.request.url)) return false;

      const errorData = await error.response.json();
      return isEpicApiError(errorData) && accessTokenValidationErrors.has(errorData.errorCode);
    }
  },
  hooks: {
    beforeRetry: [
      async ({ request, error }) => {
        const account = getAccountFromToken(request.headers.get('Authorization')?.replace('Bearer ', '') || '');
        if (!account) {
          throw error;
        }

        accessTokenCache.delete(account.accountId);

        const accessData = await Authentication.getAccessTokenUsingDeviceAuth(account, false);
        request.headers.set('Authorization', `Bearer ${accessData.access_token}`);
      }
    ],
    beforeError: [
      async (error) => {
        if (!isHTTPError(error) || !isEpicUrl(error.request.url)) return error;

        const data = await error.response.json();
        if (!isEpicApiError(data)) return error;

        throw new EpicAPIError(data, error.request, error.response.status);
      }
    ]
  }
});

function getAccountFromToken(token: string) {
  const accounts = get(accountsStorage).accounts;
  const accountId = accessTokenCache.entries().find(([, accessData]) => accessData.access_token === token)?.[0];
  return accounts.find((account) => account.accountId === accountId);
}

function isEpicUrl(url: string) {
  return (new URL(url).hostname.endsWith('epicgames.com'));
}

export default tauriKy;
