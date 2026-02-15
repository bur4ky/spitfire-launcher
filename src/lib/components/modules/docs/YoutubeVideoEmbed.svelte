<script lang="ts">
  type Props = {
    title?: string;
    videoId: string;
  };

  const { title, videoId }: Props = $props();
</script>

<div class="mt-4 aspect-video w-full">
  <iframe
    class="size-full border-none"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
    allowfullscreen
    src="https://www.youtube-nocookie.com/embed/{videoId}"
    {title}
  ></iframe>
</div>
