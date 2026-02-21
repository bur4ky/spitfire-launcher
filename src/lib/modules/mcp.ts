import { EpicAPIError } from '$lib/exceptions/EpicAPIError';
import { AuthSession } from '$lib/modules/auth-session';
import { baseGameService } from '$lib/services/epic';
import type { AccountData } from '$types/account';
import type { FullQueryProfile, MCPOperation, MCPProfileId } from '$types/game/mcp';

export class MCP {
  static compose<T>(account: AccountData, operation: MCPOperation, profile: MCPProfileId, data: Record<string, any>) {
    const route = operation === 'QueryPublicProfile' ? 'public' : 'client';
    return AuthSession.ky(account, baseGameService)
      .post<T>(`profile/${account.accountId}/${route}/${operation}?profileId=${profile}&rvn=-1`, { json: data })
      .json();
  }

  static queryProfile<T extends MCPProfileId>(account: AccountData, profile: T) {
    return this.compose<FullQueryProfile<T>>(account, 'QueryProfile', profile, {});
  }

  static queryPublicProfile<T extends Extract<MCPProfileId, 'campaign' | 'common_public'>>(
    account: AccountData,
    targetAccountId: string,
    profile: T
  ) {
    return AuthSession.ky(account, baseGameService)
      .post<
        FullQueryProfile<T>
      >(`profile/${targetAccountId}/public/QueryPublicProfile?profileId=${profile}&rvn=-1`, { json: {} })
      .json();
  }

  static clientQuestLogin<T extends Extract<MCPProfileId, 'athena' | 'campaign'>>(account: AccountData, profile: T) {
    return this.compose<FullQueryProfile<T>>(account, 'ClientQuestLogin', profile, { streamingAppKey: '' });
  }

  static async purchaseCatalogEntry(
    account: AccountData,
    offerId: string,
    price: number,
    isPriceRetry?: boolean
  ): Promise<{
    vbucksSpent: number;
    data: any;
  }> {
    try {
      const purchaseData = await MCP.compose(account, 'PurchaseCatalogEntry', 'common_core', {
        offerId,
        purchaseQuantity: 1,
        currency: 'MtxCurrency',
        currencySubType: '',
        expectedTotalPrice: price,
        gameContext: 'GameContext: Frontend.CatabaScreen'
      });

      return {
        vbucksSpent: price,
        data: purchaseData
      };
    } catch (error) {
      if (error instanceof EpicAPIError && MCP.isPriceMismatchError(error) && !isPriceRetry) {
        const newPrice = Number.parseInt(error.messageVars[1]);
        if (newPrice > price) throw error;

        return this.purchaseCatalogEntry(account, offerId, newPrice, true);
      }

      throw error;
    }
  }

  static async giftCatalogEntry(
    account: AccountData,
    offerId: string,
    receivers: string[],
    price: number,
    isPriceRetry?: boolean
  ): Promise<{
    vbucksSpent: number;
    data: any;
  }> {
    try {
      const purchaseData = await MCP.compose(account, 'GiftCatalogEntry', 'common_core', {
        offerId,
        currency: 'MtxCurrency',
        currencySubType: '',
        expectedTotalPrice: price,
        gameContext: 'Frontend.CatabaScreen',
        receiverAccountIds: receivers,
        giftWrapTemplateId: '',
        personalMessage: 'Hope you like my gift!'
      });

      return {
        vbucksSpent: price * receivers.length,
        data: purchaseData
      };
    } catch (error) {
      if (error instanceof EpicAPIError && MCP.isPriceMismatchError(error) && !isPriceRetry) {
        const newPrice = Number.parseInt(error.messageVars[1]);
        if (newPrice > price) throw error;

        return this.giftCatalogEntry(account, offerId, receivers, newPrice, true);
      }

      throw error;
    }
  }

  private static isPriceMismatchError(error: EpicAPIError) {
    return (
      error.errorCode === 'errors.com.epicgames.modules.gamesubcatalog.catalog_out_of_date' &&
      error.errorMessage.toLowerCase().includes('did not match actual price') &&
      !Number.isNaN(Number.parseInt(error.messageVars[1]))
    );
  }
}
