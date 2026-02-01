import { checkLogin } from '$lib/utils';

export async function load() {
  await checkLogin();
}