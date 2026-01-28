import { platform as getPlatform } from '@tauri-apps/plugin-os';

const platform = getPlatform();

type Category = {
  key: typeof SidebarCategoryKeys[number];
  items: {
    key: typeof SidebarItemKeys[number];
    href: string;
  }[];
};

export const SidebarCategoryKeys = Object.freeze([
  'account',
  'brStw',
  'downloader',
  'authentication'
] as const);

export const SidebarItemKeys = Object.freeze([
  'vbucksInformation',
  'friendsManagement',
  'redeemCodes',
  'epicGamesWebsite',
  'eula',

  'autoKick',
  'taxiService',
  'customStatus',
  'partyManagement',
  'serverStatus',
  'itemShop',
  'earnedXP',
  'dailyQuests',
  'stwMissionAlerts',
  'lookupPlayers',

  'library',
  'downloads',

  'exchangeCode',
  'accessToken',
  'deviceAuth'
] as const);

export const SidebarCategories = Object.freeze([
  {
    key: 'account',
    items: [
      {
        key: 'vbucksInformation',
        href: '/account-management/vbucks-information'
      },
      {
        key: 'friendsManagement',
        href: '/account-management/friends-management'
      },
      {
        key: 'redeemCodes',
        href: '/account-management/redeem-codes'
      },
      {
        key: 'epicGamesWebsite',
        href: '/account-management/epic-games-website'
      },
      {
        key: 'eula',
        href: '/account-management/eula'
      }
    ]
  },
  {
    key: 'brStw',
    items: [
      {
        key: 'autoKick',
        href: '/br-stw/auto-kick'
      },
      {
        key: 'taxiService',
        href: '/br-stw/taxi-service'
      },
      {
        key: 'customStatus',
        href: '/br-stw/custom-status'
      },
      {
        key: 'partyManagement',
        href: '/br-stw/party-management'
      },
      {
        key: 'serverStatus',
        href: '/br-stw/server-status'
      },
      {
        key: 'itemShop',
        href: '/br-stw/item-shop'
      },
      {
        key: 'earnedXP',
        href: '/br-stw/earned-xp'
      },
      {
        key: 'dailyQuests',
        href: '/br-stw/daily-quests'
      },
      {
        key: 'stwMissionAlerts',
        href: '/br-stw/stw-mission-alerts'
      },
      {
        key: 'lookupPlayers',
        href: '/br-stw/lookup-players'
      }
    ]
  },
  platform === 'windows' && {
    key: 'downloader',
    items: [
      {
        key: 'library',
        href: '/downloader/library'
      },
      {
        key: 'downloads',
        href: '/downloader/downloads'
      }
    ]
  },
  {
    key: 'authentication',
    items: [
      {
        key: 'exchangeCode',
        href: '/authentication/exchange-code'
      },
      {
        key: 'accessToken',
        href: '/authentication/access-token'
      },
      {
        key: 'deviceAuth',
        href: '/authentication/device-auth'
      }
    ]
  }
].filter((x) => !!x) as Category[]);