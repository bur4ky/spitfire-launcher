import { type ClientCredentials, defaultClient } from '$lib/constants/clients';
import { oauthService } from '$lib/services/epic';
import type {
  DeviceAuthData,
  EpicDeviceAuthLoginData,
  EpicExchangeCodeData,
  EpicExchangeCodeLoginData,
  EpicOAuthData,
  EpicTokenType
} from '$types/game/authorizations';

export class Authentication {
  static getAccessTokenUsingDeviceAuth(deviceAuthData: DeviceAuthData, tokenType: EpicTokenType = 'eg1') {
    return oauthService
      .post<EpicDeviceAuthLoginData>('token', {
        body: new URLSearchParams({
          grant_type: 'device_auth',
          account_id: deviceAuthData.accountId,
          device_id: deviceAuthData.deviceId,
          secret: deviceAuthData.secret,
          token_type: tokenType
        }).toString()
      })
      .json();
  }

  static getAccessTokenUsingClientCredentials(clientCredentials: ClientCredentials = defaultClient) {
    return oauthService
      .post<EpicOAuthData>('token', {
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          token_type: 'eg1'
        }).toString(),
        headers: {
          Authorization: `Basic ${clientCredentials.base64}`
        }
      })
      .json();
  }

  static getAccessTokenUsingDeviceCode(deviceCode: string, clientCredentials: ClientCredentials = defaultClient) {
    return oauthService
      .post<EpicOAuthData>('token', {
        body: new URLSearchParams({
          grant_type: 'device_code',
          device_code: deviceCode,
          token_type: 'eg1'
        }).toString(),
        headers: {
          Authorization: `Basic ${clientCredentials.base64}`
        }
      })
      .json();
  }

  static getExchangeCodeUsingAccessToken(accessToken: string) {
    return oauthService
      .get<EpicExchangeCodeData>('exchange', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .json();
  }

  static getAccessTokenUsingExchangeCode(
    exchangeCode: string,
    clientCredentials: ClientCredentials = defaultClient,
    tokenType: EpicTokenType = 'eg1'
  ) {
    return oauthService
      .post<EpicExchangeCodeLoginData>('token', {
        body: new URLSearchParams({
          grant_type: 'exchange_code',
          exchange_code: exchangeCode.replace(/[|`'"]/g, ''),
          token_type: tokenType
        }).toString(),
        headers: {
          Authorization: `Basic ${clientCredentials.base64}`
        }
      })
      .json();
  }
}
