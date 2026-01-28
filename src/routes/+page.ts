import { redirect } from '@sveltejs/kit';
import { settingsStore } from '$lib/storage';
import { SidebarCategories } from '$lib/constants/sidebar';

export async function load() {
  const startingPage = settingsStore.get().app?.startingPage;
  const pages = SidebarCategories.flatMap((x) => x.items);
  const href = (pages.find((x) => x.key === startingPage) || pages.find((x) => x.key === 'stwMissionAlerts')!)?.href;

  redirect(307, href);
}