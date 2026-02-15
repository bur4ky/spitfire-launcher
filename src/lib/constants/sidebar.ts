import { platform as getPlatform } from '@tauri-apps/plugin-os';
import UsersIcon from '@lucide/svelte/icons/users';
import TicketIcon from '@lucide/svelte/icons/ticket';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import UserXIcon from '@lucide/svelte/icons/user-x';
import CarIcon from '@lucide/svelte/icons/car';
import MessageSquareIcon from '@lucide/svelte/icons/message-square';
import PartyPopperIcon from '@lucide/svelte/icons/party-popper';
import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';
import BellIcon from '@lucide/svelte/icons/bell';
import LibraryIcon from '@lucide/svelte/icons/library';
import DownloadIcon from '@lucide/svelte/icons/download';
import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import KeyIcon from '@lucide/svelte/icons/key';
import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
import WalletIcon from '@lucide/svelte/icons/wallet';
import GlobeIcon from '@lucide/svelte/icons/globe';
import ServerIcon from '@lucide/svelte/icons/server';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import ListChecksIcon from '@lucide/svelte/icons/list-checks';
import SearchIcon from '@lucide/svelte/icons/search';
import type { Component } from 'svelte';
import type { IconProps } from '@lucide/svelte';
const platform = getPlatform();

type Category = {
  key: (typeof SidebarCategoryKeys)[number];
  items: {
    key: (typeof SidebarItemKeys)[number];
    href: string;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    icon: Component<IconProps, {}, ''>;
  }[];
};

export const SidebarCategoryKeys = Object.freeze(['account', 'brStw', 'downloader', 'authentication'] as const);

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

export const SidebarCategories = Object.freeze(
  [
    {
      key: 'account',
      items: [
        {
          key: 'vbucksInformation',
          href: '/account-management/vbucks',
          icon: WalletIcon
        },
        {
          key: 'friendsManagement',
          href: '/account-management/friends',
          icon: UsersIcon
        },
        {
          key: 'redeemCodes',
          href: '/account-management/redeem-codes',
          icon: TicketIcon
        },
        {
          key: 'epicGamesWebsite',
          href: '/account-management/epic-games-website',
          icon: GlobeIcon
        },
        {
          key: 'eula',
          href: '/account-management/eula',
          icon: FileTextIcon
        }
      ]
    },
    {
      key: 'brStw',
      items: [
        {
          key: 'autoKick',
          href: '/br-stw/auto-kick',
          icon: UserXIcon
        },
        {
          key: 'taxiService',
          href: '/br-stw/taxi-service',
          icon: CarIcon
        },
        {
          key: 'customStatus',
          href: '/br-stw/custom-status',
          icon: MessageSquareIcon
        },
        {
          key: 'partyManagement',
          href: '/br-stw/party',
          icon: PartyPopperIcon
        },
        {
          key: 'serverStatus',
          href: '/br-stw/server-status',
          icon: ServerIcon
        },
        {
          key: 'itemShop',
          href: '/br-stw/item-shop',
          icon: ShoppingBagIcon
        },
        {
          key: 'earnedXP',
          href: '/br-stw/earned-xp',
          icon: TrendingUpIcon
        },
        {
          key: 'dailyQuests',
          href: '/br-stw/daily-quests',
          icon: ListChecksIcon
        },
        {
          key: 'stwMissionAlerts',
          href: '/br-stw/stw-mission-alerts',
          icon: BellIcon
        },
        {
          key: 'lookupPlayers',
          href: '/br-stw/lookup-players',
          icon: SearchIcon
        }
      ]
    },
    platform === 'windows' && {
      key: 'downloader',
      items: [
        {
          key: 'library',
          href: '/downloader/library',
          icon: LibraryIcon
        },
        {
          key: 'downloads',
          href: '/downloader/downloads',
          icon: DownloadIcon
        }
      ]
    },
    {
      key: 'authentication',
      items: [
        {
          key: 'exchangeCode',
          href: '/authentication/exchange-code',
          icon: KeyRoundIcon
        },
        {
          key: 'accessToken',
          href: '/authentication/access-token',
          icon: KeyIcon
        },
        {
          key: 'deviceAuth',
          href: '/authentication/device-auth',
          icon: SmartphoneIcon
        }
      ]
    }
  ].filter((x) => !!x) as Category[]
);
