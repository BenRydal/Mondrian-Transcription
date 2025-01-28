<script lang="ts">
  import P5, { type Sketch } from 'p5-svelte';
  import type p5 from 'p5';
  import { onMount } from 'svelte';
  import { drawingConfig } from '../stores/drawingConfig';
  import { drawingState, createNewPath } from '../stores/drawingState';
  import { setupDrawing, drawPaths } from './features/drawing';
  import { setupVideo } from './features/video';
  import VideoControls from '../components/video/VideoControls.svelte';

  let containerDiv: HTMLDivElement;
  let width = 800;
  let height = 400;
  let isDraggingSplitter = false;
  let videoElement: p5.Element | null = null;
  let p5Instance: p5;
  let lastVideoTime = 0;
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  $: videoHtmlElement = videoElement ? (videoElement as any).elt : null;

  function handleSplitterDrag(e: MouseEvent) {
    if (isDraggingSplitter) {
      e.preventDefault();
      e.stopPropagation();

      const rect = containerDiv.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      const minVideoWidth = 30;
      const minImageWidth = 30;
      const constrainedPosition = Math.min(
        Math.max(position, minVideoWidth),
        100 - minImageWidth
      );

      drawingConfig.update(config => ({
        ...config,
        splitPosition: constrainedPosition
      }));

      // Prevent any drawing while dragging
      if (p5Instance) {
        p5Instance.noLoop();
      }
    }
  }

  function handleMouseDown() {
    if (videoHtmlElement && !$drawingState.isVideoPlaying) {
      videoHtmlElement.play();
    }
  }

  function handleMouseUp() {
    if (videoHtmlElement && $drawingState.isVideoPlaying) {
      videoHtmlElement.pause();
    }
    // Resume p5 drawing loop if it was paused
    if (isDraggingSplitter && p5Instance) {
      p5Instance.loop();
    }
    isDraggingSplitter = false;
  }

  onMount(() => {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && videoHtmlElement) {
        e.preventDefault();
        if (videoHtmlElement.paused) {
          videoHtmlElement.play();
        } else {
          videoHtmlElement.pause();
        }
      }
    });

    const updateDimensions = () => {
      height = window.innerHeight - 64;
      width = containerDiv.clientWidth;
      if (p5Instance) {
        p5Instance.resizeCanvas(width, height);
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  });


  const sketch: Sketch = (p5: p5) => {
    p5Instance = p5;
    const { handleMousePressed, handleMouseDragged, handleMouseReleased } = setupDrawing(p5);

    p5.setup = () => {
      const canvas = p5.createCanvas(width, height);
      canvas.parent(containerDiv);
      p5.strokeCap(p5.ROUND);
      p5.strokeJoin(p5.ROUND);
    };

    p5.draw = () => {
      p5.background(255);
      const splitX = (width * $drawingConfig.splitPosition) / 100;

      // Update video time
      if (videoElement) {
        const { updateVideoTime, drawVideo } = setupVideo(p5);
        lastVideoTime = updateVideoTime(videoElement, lastVideoTime);
        drawVideo(p5, videoElement);
      }

      // Draw image
      const currentImage = $drawingState.imageElement;
      if (currentImage && $drawingState.imageWidth > 0) {
        const aspectRatio = $drawingState.imageWidth / $drawingState.imageHeight;
        const displayHeight = Math.min(height, (width - splitX) / aspectRatio);
        p5.image(currentImage, splitX, 0, width - splitX, displayHeight);
      }

      // Draw all paths
      drawPaths(p5);
    };

    p5.mousePressed = () => {
      if (!isDraggingSplitter) {
        handleMousePressed();
        handleMouseDown();
      }
    };

    p5.mouseDragged = () => {
      if (!isDraggingSplitter) {
        handleMouseDragged();
      }
    };

    p5.mouseReleased = () => {
      handleMouseReleased();
      handleMouseUp();
    };
  };

  export function setVideo(video: HTMLVideoElement) {
    if (videoElement) {
      (videoElement as any).remove();
    }
    const { setVideo: setupP5Video } = setupVideo(p5Instance);
    videoElement = setupP5Video(video);

    // Create initial path
    createNewPath(colors[0]);
  }

  export function setImage(image: HTMLImageElement) {
    p5Instance.loadImage(image.src, (p5Img: p5.Image) => {
      drawingState.update(state => ({
        ...state,
        imageWidth: image.width,
        imageHeight: image.height,
        imageElement: p5Img
      }));
    });
  }

  export function startNewPath() {
    if (videoHtmlElement) {
      videoHtmlElement.currentTime = 0;
      videoHtmlElement.pause();
      const currentPathCount = $drawingState.paths.length;
      const newColor = colors[currentPathCount % colors.length];
      createNewPath(newColor);
    }
  }

  export function exportPath() {
    const paths = $drawingState.paths;
    paths.forEach((path, index) => {
      const csv = path.points.map(p => `${p.x},${p.y},${p.time}`).join('\n');
      const blob = new Blob([`x,y,time\n${csv}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `path-${index + 1}.csv`;
      a.click();
    });
  }

  export function clearDrawing() {
    // Reset video to beginning
    if (videoHtmlElement) {
      videoHtmlElement.currentTime = 0;
      videoHtmlElement.pause();
    }

    // Clear all paths but immediately create a new one
    drawingState.update(state => ({
      ...state,
      paths: [],
      currentPathId: 0
    }));

    // Create a new path with the first color
    createNewPath(colors[0]);
  }

  $: if (containerDiv && $drawingConfig) {
    containerDiv.style.setProperty('--split-width', `${$drawingConfig.splitPosition}%`);
  }
</script>

<div
  bind:this={containerDiv}
  class="relative w-full h-[calc(100vh-64px)]"
  on:mousemove={handleSplitterDrag}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  role="application"
  aria-label="Drawing Canvas"
>
  <P5 {sketch} />

  <div
    class="absolute top-0 bottom-0 w-8 bg-transparent cursor-col-resize hover:bg-black/5"
    style="left: calc({$drawingConfig.splitPosition}% - 16px)"
    on:mousedown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingSplitter = true;
    }}
    role="separator"
    aria-label="Resize panels"
  >
    <div
      class="absolute top-0 bottom-0 w-1 bg-gray-400 hover:bg-blue-500 transition-colors"
      style="left: 50%"
    />
  </div>

  {#if videoHtmlElement}
    <VideoControls videoElement={videoHtmlElement} />
  {/if}
</div>