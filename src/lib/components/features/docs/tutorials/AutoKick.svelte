<script lang="ts">
  import BaseModal from '$components/features/docs/BaseModal.svelte';
  import YoutubeVideoEmbed from '$components/features/docs/YoutubeVideoEmbed.svelte';
  import { t } from '$lib/utils';
</script>

<BaseModal description={$t('docs.autoKick.description')} title={$t('autoKick.page.title')}>
  <h3>{$t('docs.importantNotes')}</h3>
  <ul>
    <li>{$t('docs.autoKick.importantNotes.0')}</li>
    <li>{$t('docs.autoKick.importantNotes.1')}</li>
  </ul>

  <YoutubeVideoEmbed title="Auto-Kick Tutorial" videoId="jkQYdWAARBg"/>
</BaseModal>