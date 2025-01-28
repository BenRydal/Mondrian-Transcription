import type p5 from "p5";
import { get } from "svelte/store";
import { drawingConfig } from "../stores/drawingConfig";
import { drawingState } from "../stores/drawingState";

export function isInDrawableArea(p5: p5, x: number, y: number): boolean {
  const config = get(drawingConfig);
  const splitX = (p5.width * config.splitPosition) / 100;

  return x > splitX && x < p5.width && y > 0 && y < p5.height;
}

export function convertToImageCoordinates(p5: p5, x: number, y: number) {
  const config = get(drawingConfig);
  const state = get(drawingState);
  const splitX = (p5.width * config.splitPosition) / 100;

  const constrainedX = p5.constrain(x, splitX, p5.width);
  const constrainedY = p5.constrain(y, 0, p5.height);

  const drawingAreaWidth = p5.width - splitX;
  const drawingAreaHeight = p5.height;

  const imageX =
    ((constrainedX - splitX) * state.imageWidth) / drawingAreaWidth;
  const imageY = (constrainedY * state.imageHeight) / drawingAreaHeight;

  return {
    x: imageX,
    y: imageY,
  };
}
