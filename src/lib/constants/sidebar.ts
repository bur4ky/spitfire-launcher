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
import CodeIcon from '@lucide/svelte/icons/code';
import type { LucideIcon } from '$types';

type Category = {
  id: string;
  hidden: boolean;
  items: {
    id: string;
    href: string;
    icon: LucideIcon;
    requiresLogin: boolean;
  }[];
};

export const SidebarCategories = Object.freeze([
  {
    id: 'account',
    hidden: false,
    items: [
      {
        id: 'vbucksInformation',
        href: '/account-management/vbucks',
        icon: WalletIcon,
        requiresLogin: true
      },
      {
        id: 'friendsManagement',
        href: '/account-management/friends',
        icon: UsersIcon,
        requiresLogin: true
      },
      {
        id: 'redeemCodes',
        href: '/account-management/redeem-codes',
        icon: TicketIcon,
        requiresLogin: true
      },
      {
        id: 'epicGamesWebsite',
        href: '/account-management/epic-games-website',
        icon: GlobeIcon,
        requiresLogin: true
      },
      {
        id: 'eula',
        href: '/account-management/eula',
        icon: FileTextIcon,
        requiresLogin: true
      }
    ]
  },
  {
    id: 'brStw',
    hidden: false,
    items: [
      {
        id: 'autoKick',
        href: '/br-stw/auto-kick',
        icon: UserXIcon,
        requiresLogin: true
      },
      {
        id: 'taxiService',
        href: '/br-stw/taxi-service',
        icon: CarIcon,
        requiresLogin: true
      },
      {
        id: 'customStatus',
        href: '/br-stw/custom-status',
        icon: MessageSquareIcon,
        requiresLogin: true
      },
      {
        id: 'partyManagement',
        href: '/br-stw/party',
        icon: PartyPopperIcon,
        requiresLogin: true
      },
      {
        id: 'serverStatus',
        href: '/br-stw/server-status',
        icon: ServerIcon,
        requiresLogin: false
      },
      {
        id: 'itemShop',
        href: '/br-stw/item-shop',
        icon: ShoppingBagIcon,
        requiresLogin: false
      },
      {
        id: 'earnedXP',
        href: '/br-stw/earned-xp',
        icon: TrendingUpIcon,
        requiresLogin: true
      },
      {
        id: 'dailyQuests',
        href: '/br-stw/daily-quests',
        icon: ListChecksIcon,
        requiresLogin: true
      },
      {
        id: 'stwMissionAlerts',
        href: '/br-stw/stw-mission-alerts',
        icon: BellIcon,
        requiresLogin: false
      },
      {
        id: 'lookupPlayers',
        href: '/br-stw/lookup-players',
        icon: SearchIcon,
        requiresLogin: true
      },
      {
        id: 'mcp',
        href: '/br-stw/mcp',
        icon: CodeIcon,
        requiresLogin: true
      }
    ]
  },
  {
    id: 'downloader',
    hidden: platform() !== 'windows',
    items: [
      {
        id: 'library',
        href: '/downloader/library',
        icon: LibraryIcon,
        requiresLogin: true
      },
      {
        id: 'downloads',
        href: '/downloader/downloads',
        icon: DownloadIcon,
        requiresLogin: true
      }
    ]
  },
  {
    id: 'authentication',
    hidden: false,
    items: [
      {
        id: 'exchangeCode',
        href: '/authentication/exchange-code',
        icon: KeyRoundIcon,
        requiresLogin: true
      },
      {
        id: 'accessToken',
        href: '/authentication/access-token',
        icon: KeyIcon,
        requiresLogin: true
      },
      {
        id: 'deviceAuth',
        href: '/authentication/device-auth',
        icon: SmartphoneIcon,
        requiresLogin: true
      }
    ]
  }
] as const satisfies readonly Category[]);

export const SidebarItems = Object.freeze(SidebarCategories.flatMap((category) => [...category.items]));

export type SidebarCategory = (typeof SidebarCategories)[number];
export type SidebarItem = SidebarCategory['items'][number];
