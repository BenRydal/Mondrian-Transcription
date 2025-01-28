// lib/stores/drawingState.ts
import { writable } from "svelte/store";
import type p5 from "p5";
import type { Point } from "../p5/types/sketch";

export interface PathData {
  points: Point[];
  color: string;
  pathId: number;
}

export interface DrawingState {
  isVideoPlaying: boolean;
  isDrawing: boolean;
  paths: PathData[];
  imageWidth: number;
  imageHeight: number;
  videoTime: number;
  imageElement: p5.Image | null;
  currentPathId: number;
}

const initialState: DrawingState = {
  isVideoPlaying: false,
  isDrawing: false,
  paths: [],
  imageWidth: 0,
  imageHeight: 0,
  videoTime: 0,
  imageElement: null,
  currentPathId: 0,
};

export const drawingState = writable<DrawingState>(initialState);

export function createNewPath(color: string) {
  drawingState.update((state) => {
    console.log("Creating new path with color:", color);
    const newPathId = state.currentPathId + 1;
    return {
      ...state,
      currentPathId: newPathId,
      paths: [
        ...state.paths,
        {
          points: [],
          color,
          pathId: newPathId,
        },
      ],
    };
  });
}

export function addPointToCurrentPath(point: Point) {
  drawingState.update((state) => {
    // Find current path index
    const currentPathIndex = state.paths.findIndex(
      (p) => p.pathId === state.currentPathId
    );

    if (currentPathIndex === -1) {
      console.error("No current path found for pathId:", state.currentPathId);
      // Create a new path with a default color if none exists
      const colors = [
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
      ];
      const newColor = colors[state.paths.length % colors.length];
      createNewPath(newColor);
      return state;
    }

    console.log("Adding point to path:", point);
    console.log("Current path index:", currentPathIndex);

    // Create new paths array with updated points
    const updatedPaths = [...state.paths];
    updatedPaths[currentPathIndex] = {
      ...updatedPaths[currentPathIndex],
      points: [...updatedPaths[currentPathIndex].points, point],
    };

    return {
      ...state,
      paths: updatedPaths,
    };
  });
}
