<script lang="ts">
  import P5Wrapper from '../lib/p5/P5Wrapper.svelte';
  import Navbar from '$lib/components/nav/Navbar.svelte';

  let p5Component: P5Wrapper;

  function handleVideoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.autoplay = false;
      video.loop = false;
      p5Component.setVideo(video);
    }
  }

  function handleImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      image.onload = () => p5Component.setImage(image);
    }
  }

  function handleSavePath() {
    p5Component.exportPath();
  }

  function handleClear() {
    p5Component.clearDrawing();
  }

  function handleNewPath() {
    p5Component.startNewPath();
  }
</script>

<Navbar
  onImageUpload={handleImageUpload}
  onVideoUpload={handleVideoUpload}
  onSavePath={handleSavePath}
  onClear={handleClear}
  onNewPath={handleNewPath}
/>
<P5Wrapper bind:this={p5Component} />