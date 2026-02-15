import { SidebarCategories } from '$lib/constants/sidebar';
import { settingsStore } from '$lib/storage';
import { redirect } from '@sveltejs/kit';

export async function load() {
  const startingPage = settingsStore.get().app?.startingPage;
  const pages = SidebarCategories.flatMap((x) => x.items);
  const href = (pages.find((x) => x.key === startingPage) || pages.find((x) => x.key === 'stwMissionAlerts')!)?.href;

  redirect(307, href);
}
