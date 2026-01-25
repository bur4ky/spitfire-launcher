<script lang="ts">
  type Props = {
    title?: string;
    videoId: string;
  };

  const { title, videoId }: Props = $props();
</script>

<div class="aspect-video w-full mt-4">
  <iframe
    class="border-none size-full"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
    allowfullscreen
    src="https://www.youtube-nocookie.com/embed/{videoId}"
    {title}
  ></iframe>
</div>