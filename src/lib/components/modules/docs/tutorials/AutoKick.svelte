<script lang="ts">
  import BaseModal from '$components/modules/docs/BaseModal.svelte';
  import YoutubeVideoEmbed from '$components/modules/docs/YoutubeVideoEmbed.svelte';
  import { t } from '$lib/i18n';
</script>

<BaseModal title={$t('autoKick.page.title')}>
  <p>{$t('docs.autoKick.description')}</p>

  <h3>{$t('docs.importantNotes')}</h3>
  <ul>
    <li>{$t('docs.autoKick.importantNotes.0')}</li>
    <li>{$t('docs.autoKick.importantNotes.1')}</li>
  </ul>

  <YoutubeVideoEmbed title="Auto-Kick Tutorial" videoId="jkQYdWAARBg" />
</BaseModal>
