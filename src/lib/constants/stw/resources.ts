import { derived } from 'svelte/store';
import { t } from '$lib/i18n';

export const Rarities = Object.freeze({
  Common: 'c',
  Uncommon: 'uc',
  Rare: 'r',
  Epic: 'vr',
  Legendary: 'sr',
  Mythic: 'ur'
} as const);

export const RarityNames = derived(t, ($t) => ({
  [Rarities.Common]: $t('rarities.common'),
  [Rarities.Uncommon]: $t('rarities.uncommon'),
  [Rarities.Rare]: $t('rarities.rare'),
  [Rarities.Epic]: $t('rarities.epic'),
  [Rarities.Legendary]: $t('rarities.legendary'),
  [Rarities.Mythic]: $t('rarities.mythic')
}));

export const RarityColors = Object.freeze({
  [Rarities.Common]: '#8B9399',
  [Rarities.Uncommon]: '#6ABB1E',
  [Rarities.Rare]: '#3D9BF7',
  [Rarities.Epic]: '#6C3F9E',
  [Rarities.Legendary]: '#DA791D',
  [Rarities.Mythic]: '#D1AE49'
} as const);

export const FounderEditions = Object.freeze({
  Standard: 'Quest:foundersquest_getrewards_0_1',
  Deluxe: 'Quest:foundersquest_getrewards_1_2',
  SuperDeluxe: 'Quest:foundersquest_getrewards_2_3',
  Limited: 'Quest:foundersquest_getrewards_3_4',
  Ultimate: 'Quest:foundersquest_getrewards_4_5'
} as const);

export const FounderEditionNames = derived(t, ($t) => ({
  [FounderEditions.Standard]: $t('stw.founderEditions.standard'),
  [FounderEditions.Deluxe]: $t('stw.founderEditions.deluxe'),
  [FounderEditions.SuperDeluxe]: $t('stw.founderEditions.superDeluxe'),
  [FounderEditions.Limited]: $t('stw.founderEditions.limited'),
  [FounderEditions.Ultimate]: $t('stw.founderEditions.ultimate')
}));
