import { redirect } from '@sveltejs/kit';
import { getStartingPage } from '$lib/utils';

export async function load() {
  redirect(307, await getStartingPage());
}