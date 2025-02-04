import type p5 from "p5";
import type { Point } from "../types/sketch";
import { get } from "svelte/store";
import {
  drawingState,
  addPointToCurrentPath,
  toggleDrawing,
} from "../../stores/drawingState";
import { drawingConfig } from "../../stores/drawingConfig";
import {
  isInDrawableArea,
  convertToImageCoordinates,
} from "../../utils/drawingUtils";

class TimeBasedSampler {
  private lastSampleTime: number = 0;

  constructor(private sampleInterval: number) {}

  shouldSample(currentTime: number): boolean {
    if (currentTime - this.lastSampleTime >= this.sampleInterval) {
      this.lastSampleTime = currentTime;
      return true;
    }
    return false;
  }

  reset() {
    this.lastSampleTime = 0;
  }
}

export function setupDrawing(p5: p5) {
  const sampler = new TimeBasedSampler(get(drawingConfig).pollingRate / 1000);

  drawingConfig.subscribe((config) => {
    sampler.reset();
  });

  const addCurrentPoint = () => {
    const state = get(drawingState);
    if (!state.shouldTrackMouse) return;

    if (isInDrawableArea(p5, p5.mouseX, p5.mouseY)) {
      if (sampler.shouldSample(state.videoTime)) {
        const coords = convertToImageCoordinates(p5, p5.mouseX, p5.mouseY);
        const point: Point = {
          ...coords,
          time: state.videoTime,
          pathId: state.currentPathId,
        };
        addPointToCurrentPath(point);
      }
    }
  };

  const handleMousePressed = (videoElement?: HTMLVideoElement) => {
    if (isInDrawableArea(p5, p5.mouseX, p5.mouseY)) {
      if (!get(drawingState).shouldTrackMouse) {
        sampler.reset();
      }
      toggleDrawing(videoElement);
    }
  };

  const handleDrawing = () => {
    const state = get(drawingState);
    if (state.shouldTrackMouse) {
      addCurrentPoint();
    }
  };

  return {
    handleMousePressed,
    handleDrawing,
  };
}

export function drawPaths(p5: p5) {
  const state = get(drawingState);
  const config = get(drawingConfig);
  const splitX = (p5.width * config.splitPosition) / 100;
  const drawingAreaWidth = p5.width - splitX;
  const drawingAreaHeight = p5.height;
  const ENDPOINT_MARKER_SIZE = 15;

  p5.push();

  state.paths.forEach((path) => {
    p5.strokeWeight(config.strokeWeight);
    p5.stroke(path.color);
    p5.noFill();

    if (path.points.length > 1) {
      p5.beginShape();
      path.points.forEach((point) => {
        const displayX =
          splitX + (point.x * drawingAreaWidth) / state.imageWidth;
        const displayY = (point.y * drawingAreaHeight) / state.imageHeight;
        p5.vertex(displayX, displayY);
      });
      p5.endShape();

      if (path.pathId === state.currentPathId && !state.shouldTrackMouse) {
        const lastPoint = path.points[path.points.length - 1];
        const displayX =
          splitX + (lastPoint.x * drawingAreaWidth) / state.imageWidth;
        const displayY = (lastPoint.y * drawingAreaHeight) / state.imageHeight;

        const pulseScale = (Math.sin(p5.frameCount * 0.05) + 1) * 0.25 + 0.5;

        p5.noStroke();
        for (let i = 4; i > 0; i--) {
          const alpha = 50 - i * 10;
          p5.fill(255, 0, 0, alpha);
          const size = ENDPOINT_MARKER_SIZE * (1.5 + i * 0.5) * pulseScale;
          p5.circle(displayX, displayY, size);
        }

        p5.fill(255, 0, 0, 200);
        p5.circle(displayX, displayY, ENDPOINT_MARKER_SIZE * pulseScale);

        p5.fill(255);
        p5.circle(displayX, displayY, ENDPOINT_MARKER_SIZE * 0.5 * pulseScale);
      }
    } else if (path.points.length === 1) {
      const point = path.points[0];
      const displayX = splitX + (point.x * drawingAreaWidth) / state.imageWidth;
      const displayY = (point.y * drawingAreaHeight) / state.imageHeight;
      p5.point(displayX, displayY);
    }
  });

  p5.pop();
}
