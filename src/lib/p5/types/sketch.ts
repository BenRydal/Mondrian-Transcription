import type p5 from "p5";

export interface Point {
  x: number;
  y: number;
  time: number;
  pathId: number;
}

export interface P5State {
  videoElement: p5.Element | null;
  imageElement: p5.Element | null;
  drawingPoints: Point[];
  isDrawing: boolean;
  currentPathId: number;
}
