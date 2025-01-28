import type p5 from "p5";
import type { Point } from "../types/sketch";
import { get } from "svelte/store";
import { drawingState, addPointToCurrentPath } from "../../stores/drawingState";
import { drawingConfig } from "../../stores/drawingConfig";
import {
  isInDrawableArea,
  convertToImageCoordinates,
} from "../../utils/drawingUtils";

export function setupDrawing(p5: p5) {
  const handleMousePressed = () => {
    const state = get(drawingState);

    if (isInDrawableArea(p5, p5.mouseX, p5.mouseY)) {
      const coords = convertToImageCoordinates(p5, p5.mouseX, p5.mouseY);
      const point: Point = {
        ...coords,
        time: state.videoTime,
        pathId: state.currentPathId,
      };
      addPointToCurrentPath(point);
    }
  };

  const handleMouseDragged = () => {
    const state = get(drawingState);
    const config = get(drawingConfig);

    if (isInDrawableArea(p5, p5.mouseX, p5.mouseY)) {
      if (!state.isDrawing) {
        drawingState.update((curr) => ({ ...curr, isDrawing: true }));
      }

      if (state.isDrawing) {
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

  const handleMouseReleased = () => {
    drawingState.update((curr) => ({ ...curr, isDrawing: false }));
  };

  return {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
  };
}

export function drawPaths(p5: p5) {
  const state = get(drawingState);
  const config = get(drawingConfig);
  const splitX = (p5.width * config.splitPosition) / 100;
  const drawingAreaWidth = p5.width - splitX;
  const drawingAreaHeight = p5.height;

  // Save current drawing state
  p5.push();

  state.paths.forEach((path) => {
    // Set drawing properties for each path
    p5.strokeWeight(config.strokeWeight);
    p5.stroke(path.color);
    p5.noFill();

    if (path.points.length > 1) {
      // Begin shape for continuous line
      p5.beginShape();
      path.points.forEach((point) => {
        const displayX =
          splitX + (point.x * drawingAreaWidth) / state.imageWidth;
        const displayY = (point.y * drawingAreaHeight) / state.imageHeight;
        p5.vertex(displayX, displayY);
      });
      p5.endShape();
    } else if (path.points.length === 1) {
      // Draw a point if there's only one point
      const point = path.points[0];
      const displayX = splitX + (point.x * drawingAreaWidth) / state.imageWidth;
      const displayY = (point.y * drawingAreaHeight) / state.imageHeight;
      p5.point(displayX, displayY);
    }
  });

  // Restore drawing state
  p5.pop();
}
