import { platform } from '@tauri-apps/plugin-os';
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
import type { LucideIcon } from '$types';

type Category = {
  key: (typeof SidebarCategoryKeys)[number];
  items: {
    key: (typeof SidebarItemKeys)[number];
    href: string;
    icon: LucideIcon;
    requiresLogin?: boolean;
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
          icon: WalletIcon,
          requiresLogin: true
        },
        {
          key: 'friendsManagement',
          href: '/account-management/friends',
          icon: UsersIcon,
          requiresLogin: true
        },
        {
          key: 'redeemCodes',
          href: '/account-management/redeem-codes',
          icon: TicketIcon,
          requiresLogin: true
        },
        {
          key: 'epicGamesWebsite',
          href: '/account-management/epic-games-website',
          icon: GlobeIcon,
          requiresLogin: true
        },
        {
          key: 'eula',
          href: '/account-management/eula',
          icon: FileTextIcon,
          requiresLogin: true
        }
      ]
    },
    {
      key: 'brStw',
      items: [
        {
          key: 'autoKick',
          href: '/br-stw/auto-kick',
          icon: UserXIcon,
          requiresLogin: true
        },
        {
          key: 'taxiService',
          href: '/br-stw/taxi-service',
          icon: CarIcon,
          requiresLogin: true
        },
        {
          key: 'customStatus',
          href: '/br-stw/custom-status',
          icon: MessageSquareIcon,
          requiresLogin: true
        },
        {
          key: 'partyManagement',
          href: '/br-stw/party',
          icon: PartyPopperIcon,
          requiresLogin: true
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
          icon: TrendingUpIcon,
          requiresLogin: true
        },
        {
          key: 'dailyQuests',
          href: '/br-stw/daily-quests',
          icon: ListChecksIcon,
          requiresLogin: true
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
    platform() === 'windows' && {
      key: 'downloader',
      items: [
        {
          key: 'library',
          href: '/downloader/library',
          icon: LibraryIcon,
          requiresLogin: true
        },
        {
          key: 'downloads',
          href: '/downloader/downloads',
          icon: DownloadIcon,
          requiresLogin: true
        }
      ]
    },
    {
      key: 'authentication',
      items: [
        {
          key: 'exchangeCode',
          href: '/authentication/exchange-code',
          icon: KeyRoundIcon,
          requiresLogin: true
        },
        {
          key: 'accessToken',
          href: '/authentication/access-token',
          icon: KeyIcon,
          requiresLogin: true
        },
        {
          key: 'deviceAuth',
          href: '/authentication/device-auth',
          icon: SmartphoneIcon,
          requiresLogin: true
        }
      ]
    }
  ].filter((x) => !!x) as Category[]
);
