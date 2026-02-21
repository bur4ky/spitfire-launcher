import { spitfireService } from '$lib/services/epic';
import { brShopStore } from '$lib/stores';
import type { SpitfireShop, SpitfireShopItem, SpitfireShopSection } from '$types/game/shop';

export class Shop {
  static async fetch() {
    const response = await spitfireService.get<SpitfireShop>('epic/shop').json();
    brShopStore.set(response);
    return response;
  }

  static groupBySections(offers: SpitfireShopItem[]) {
    return offers.reduce<SpitfireShopSection[]>((acc, item) => {
      const sectionName = item.section.name || 'Other';
      const section = acc.find((section) => section.name === sectionName);

      if (section) {
        section.items.push(item);
      } else {
        acc.push({
          name: sectionName,
          id: item.section.id,
          items: [item]
        });
      }

      return acc;
    }, []);
  }
}
