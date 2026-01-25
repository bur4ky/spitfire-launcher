import type { sidebarItems } from '$lib/validations/settings';
import { platform as getPlatform } from '@tauri-apps/plugin-os';
import { derived } from 'svelte/store';
import { t } from '$lib/utils';

const platform = getPlatform();

type Category = {
  key: string;
  name: string;
  items: {
    key: typeof sidebarItems[number];
    name: string;
    href: string;
  }[];
};

export const SidebarCategories = derived(t, ($t) => [
  {
    key: 'account',
    name: $t('sidebar.categories.account'),
    items: [
      {
        key: 'vbucksInformation',
        name: $t('vbucksInformation.page.title'),
        href: '/account-management/vbucks-information'
      },
      {
        key: 'friendsManagement',
        name: $t('friendsManagement.page.title'),
        href: '/account-management/friends-management'
      },
      {
        key: 'redeemCodes',
        name: $t('redeemCodes.page.title'),
        href: '/account-management/redeem-codes'
      },
      {
        key: 'epicGamesWebsite',
        name: $t('epicGamesWebsite.page.title'),
        href: '/account-management/epic-games-website'
      },
      {
        key: 'eula',
        name: $t('eula.page.title'),
        href: '/account-management/eula'
      }
    ]
  },
  {
    key: 'brStw',
    name: $t('sidebar.categories.brStw'),
    items: [
      {
        key: 'autoKick',
        name: $t('autoKick.page.title'),
        href: '/br-stw/auto-kick'
      },
      {
        key: 'taxiService',
        name: $t('taxiService.page.title'),
        href: '/br-stw/taxi-service'
      },
      {
        key: 'customStatus',
        name: $t('customStatus.page.title'),
        href: '/br-stw/custom-status'
      },
      {
        key: 'partyManagement',
        name: $t('partyManagement.page.title'),
        href: '/br-stw/party-management'
      },
      {
        key: 'serverStatus',
        name: $t('serverStatus.page.title'),
        href: '/br-stw/server-status'
      },
      {
        key: 'itemShop',
        name: $t('itemShop.page.title'),
        href: '/br-stw/item-shop'
      },
      {
        key: 'earnedXP',
        name: $t('earnedXP.page.title'),
        href: '/br-stw/earned-xp'
      },
      {
        key: 'dailyQuests',
        name: $t('dailyQuests.page.title'),
        href: '/br-stw/daily-quests'
      },
      {
        key: 'stwMissionAlerts',
        name: $t('stwMissionAlerts.page.title'),
        href: '/br-stw/stw-mission-alerts'
      },
      {
        key: 'lookupPlayers',
        name: $t('lookupPlayers.page.title'),
        href: '/br-stw/lookup-players'
      }
    ]
  },
  platform === 'windows' && {
    key: 'downloader',
    name: $t('sidebar.categories.downloader'),
    items: [
      {
        key: 'library',
        name: $t('library.page.title'),
        href: '/downloader/library'
      },
      {
        key: 'downloads',
        name: $t('downloads.page.title'),
        href: '/downloader/downloads'
      }
    ]
  },
  {
    key: 'authentication',
    name: $t('sidebar.categories.authentication'),
    items: [
      {
        key: 'exchangeCode',
        name: $t('exchangeCode.page.title'),
        href: '/authentication/exchange-code'
      },
      {
        key: 'accessToken',
        name: $t('accessToken.page.title'),
        href: '/authentication/access-token'
      },
      {
        key: 'deviceAuth',
        name: $t('deviceAuth.page.title'),
        href: '/authentication/device-auth'
      }
    ]
  }
].filter((x) => !!x), [] as Category[]);