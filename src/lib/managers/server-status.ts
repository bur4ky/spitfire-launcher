import { epicService, lightswitchService } from '$lib/services/epic';
import type { AccountData } from '$types/accounts';
import Authentication from '$lib/epic/authentication';
import AuthSession from '$lib/epic/auth-session';
import type { LightswitchData, ServerStatusSummaryData, WaitingRoomData } from '$types/game/server-status';

export default class ServerStatusManager {
  static async getLightswitch(account?: AccountData) {
    const service = account
      ? AuthSession.ky(account, lightswitchService)
      : lightswitchService;

    const token = account ? null : (await Authentication.getAccessTokenUsingClientCredentials()).access_token;
    return service.get<LightswitchData>(
      'Fortnite/status',
      token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    ).json();
  }

  static getWaitingRoom() {
    return epicService
      .get<WaitingRoomData>('https://fortnitewaitingroom-public-service-prod.ol.epicgames.com/waitingroom/api/waitingroom')
      .json()
      .catch(() => null);
  }

  static getStatusPage() {
    return epicService.get<ServerStatusSummaryData>('https://status.epicgames.com/api/v2/summary.json').json();
  }
}