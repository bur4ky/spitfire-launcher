import { epicService, lightswitchService } from '$lib/http';
import { Authentication } from '$lib/modules/authentication';
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

  static async getWaitingRoom() {
    const response = await epicService.get<WaitingRoomData>(
      'https://fortnitewaitingroom-public-service-prod.ol.epicgames.com/waitingroom/api/waitingroom'
    );

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  static getStatusPage() {
    return epicService.get<ServerStatusSummaryData>('https://status.epicgames.com/api/v2/summary.json').json();
  }
}
