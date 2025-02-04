import { writable, get } from "svelte/store";
import type p5 from "p5";
import type { Point } from "../p5/types/sketch";
import { drawingConfig } from "../stores/drawingConfig";

export interface PathData {
  points: Point[];
  color: string;
  pathId: number;
}

export interface DrawingState {
  isVideoPlaying: boolean;
  isDrawing: boolean;
  shouldTrackMouse: boolean;
  paths: PathData[];
  imageWidth: number;
  imageHeight: number;
  videoTime: number;
  imageElement: p5.Image | null;
  currentPathId: number;
  isJumping: boolean;
}

const initialState: DrawingState = {
  isVideoPlaying: false,
  isDrawing: false,
  shouldTrackMouse: false,
  paths: [],
  imageWidth: 0,
  imageHeight: 0,
  videoTime: 0,
  imageElement: null,
  currentPathId: 0,
  isJumping: false,
};

const JUMP_SECONDS = 5;
const JUMP_COOLDOWN = 250;

export function handleTimeJump(
  forward: boolean,
  videoElement?: HTMLVideoElement
) {
  drawingState.update((state) => {
    if (state.isJumping || !videoElement) return state;

    const currentTime = state.videoTime;
    let newTime: number;

    if (forward) {
      newTime = Math.min(currentTime + JUMP_SECONDS, videoElement.duration);
      videoElement.currentTime = newTime;

      const currentPathIndex = state.paths.findIndex(
        (p) => p.pathId === state.currentPathId
      );
      if (currentPathIndex === -1) return state;

      const updatedPaths = [...state.paths];
      const currentPath = updatedPaths[currentPathIndex];

      const lastPoint = currentPath.points[currentPath.points.length - 1];
      if (!lastPoint) return state;

      const samplingRate = get(drawingConfig).pollingRate / 1000;
      const updatedPoints = [...currentPath.points];

      for (
        let t = currentTime + samplingRate;
        t <= newTime;
        t += samplingRate
      ) {
        updatedPoints.push({
          x: lastPoint.x,
          y: lastPoint.y,
          time: t,
          pathId: state.currentPathId,
        });
      }

      updatedPaths[currentPathIndex] = {
        ...currentPath,
        points: updatedPoints,
      };

      return {
        ...state,
        isJumping: true,
        videoTime: newTime,
        paths: updatedPaths,
      };
    } else {
      newTime = Math.max(currentTime - JUMP_SECONDS, 0);
      videoElement.currentTime = newTime;

      const currentPathIndex = state.paths.findIndex(
        (p) => p.pathId === state.currentPathId
      );
      if (currentPathIndex === -1) return state;

      const updatedPaths = [...state.paths];
      const currentPath = updatedPaths[currentPathIndex];

      const updatedPoints = currentPath.points.filter(
        (point) => point.time <= newTime
      );
      updatedPaths[currentPathIndex] = {
        ...currentPath,
        points: updatedPoints,
      };

      if (!state.shouldTrackMouse) {
        videoElement.pause();
      }

      return {
        ...state,
        isJumping: true,
        shouldTrackMouse: false,
        isDrawing: false,
        isVideoPlaying: false,
        videoTime: newTime,
        paths: updatedPaths,
      };
    }
  });

  setTimeout(() => {
    drawingState.update((state) => ({
      ...state,
      isJumping: false,
    }));
  }, JUMP_COOLDOWN);
}

export const drawingState = writable<DrawingState>(initialState);

export function toggleDrawing(videoElement?: HTMLVideoElement) {
  drawingState.update((state) => {
    const newShouldTrack = !state.shouldTrackMouse;

    if (videoElement) {
      try {
        if (newShouldTrack) {
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error("Error playing video:", error);
            });
          }
        } else {
          videoElement.pause();
        }
      } catch (error) {
        console.error("Error handling video:", error);
      }
    }

    return {
      ...state,
      shouldTrackMouse: newShouldTrack,
      isDrawing: newShouldTrack,
      isVideoPlaying: newShouldTrack,
    };
  });
}

export function createNewPath(color: string) {
  drawingState.update((state) => {
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
    if (!state.shouldTrackMouse) return state;

    const currentPathIndex = state.paths.findIndex(
      (p) => p.pathId === state.currentPathId
    );

    if (currentPathIndex === -1) {
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
