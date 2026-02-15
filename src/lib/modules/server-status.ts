import { Authentication } from '$lib/modules/authentication';
import { epicService, lightswitchService } from '$lib/services/epic';
import type { LightswitchData, ServerStatusSummaryData, WaitingRoomData } from '$types/game/server-status';

export class ServerStatus {
  static async getLightswitch() {
    const token = (await Authentication.getAccessTokenUsingClientCredentials()).access_token;
    return lightswitchService
      .get<LightswitchData>('Fortnite/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .json();
  }

  static getWaitingRoom() {
    return epicService
      .get<WaitingRoomData>(
        'https://fortnitewaitingroom-public-service-prod.ol.epicgames.com/waitingroom/api/waitingroom'
      )
      .json()
      .catch(() => null);
  }

  static getStatusPage() {
    return epicService.get<ServerStatusSummaryData>('https://status.epicgames.com/api/v2/summary.json').json();
  }
}
