import { redirect } from '@sveltejs/kit';
import { SidebarItems } from '$lib/constants/sidebar';
import { settingsStore } from '$lib/storage';

export async function load() {
  const startingPage = settingsStore.get().app?.startingPage;
  const href = (
    SidebarItems.find((x) => x.id === startingPage) || SidebarItems.find((x) => x.id === 'stwMissionAlerts')!
  )?.href;

  redirect(307, href);
}
