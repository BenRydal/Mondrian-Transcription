<script lang="ts">
  import { onMount } from 'svelte';

  export let videoElement: HTMLVideoElement;

  let progress = 0;
  let duration = 0;
  let currentTime = 0;
  let isDraggingProgress = false;
  let progressBarElement: HTMLProgressElement;

  onMount(() => {
    if (videoElement) {
      videoElement.addEventListener('timeupdate', updateProgress);
      videoElement.addEventListener('loadedmetadata', () => {
        duration = videoElement.duration;
      });
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', updateProgress);
      }
    };
  });

  function updateProgress() {
    if (!isDraggingProgress && videoElement) {
      progress = (videoElement.currentTime / videoElement.duration) * 100;
      currentTime = videoElement.currentTime;
    }
  }

  function handleProgressBarClick(e: MouseEvent) {
    if (!videoElement || !progressBarElement) return;

    const rect = progressBarElement.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoElement.currentTime = pos * videoElement.duration;
  }

  function handleProgressBarDrag(e: MouseEvent) {
    if (isDraggingProgress && progressBarElement) {
      handleProgressBarClick(e);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="video-controls p-2 rounded-b-lg">
  <div class="w-full flex items-center">
    <progress
      bind:this={progressBarElement}
      class="progress progress-secondary flex-1 cursor-pointer"
      value={progress}
      max="100"
      on:mousedown={() => isDraggingProgress = true}
      on:mousemove={handleProgressBarDrag}
      on:mouseup={() => isDraggingProgress = false}
      on:mouseleave={() => isDraggingProgress = false}
      on:click={handleProgressBarClick}
    />
  </div>

  <div class="flex justify-between items-center mt-1 text-sm">
    <span>{formatTime(currentTime)}</span>
    <span>{formatTime(duration)}</span>
  </div>
</div>

<style>
  .video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 10;
    width: var(--split-width);
  }

  progress:focus {
    outline: none;
  }
</style>