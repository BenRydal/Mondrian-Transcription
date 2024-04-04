/**
 * Mediator class coordinates calls from and across 4 other classes and P5 sketch
 */

import { Path } from "./path.js";
import { SketchUI } from "./sketch-ui.js";
import { FloorPlan } from "./floorplan.js";
import { VideoPlayer } from "./video-player.js";
export class Mediator {
    constructor(sketch) {
        this.sk = sketch;
        this.path = new Path(sketch); // holds methods for drawing and recording path objects/data
        this.gui = new SketchUI(sketch); // holds interface containers and associated mouse over tests
        this.videoPlayer = null; // instance of videoPlayer Class instantiated/updated in loadVideo method
        this.floorPlan = null; // instance of FloorPlan Class instantiated/updated in loadFloorPlan method
        this.isRecording = false; // indicates recording mode
        this.jumpInSeconds = 5; // seconds value to fast forward and rewind path/video data
        this.isResizing = false; // indicates if user is resizing screen using mouse
        this.isFastForwarding = false; // indicates if currently fastForwarding--deals with safari bug if fastForwarding to quickly
    }

    /**
     * Handles program flow/method calls based on what data has been loaded
     */
    updateProgram() {
        this.updateCursor();
        if (this.allDataLoaded()) {
            this.videoPlayer.draw(this.gui.getVideoContainer());
            if (this.isRecording) this.updateTranscription();
        } else {
            this.gui.drawWhiteBackground(); // to display centerline properly
            if (this.floorPlanLoaded()) this.floorPlan.drawFloorPlan(this.gui.getFloorPlanContainer());
            else if (this.videoLoaded()) this.videoPlayer.draw(this.gui.getVideoContainer());
        }
        this.gui.drawCenterLine();
    }

    updateCursor() {
        if (this.overResizeSelector()) this.sk.cursor(this.sk.MOVE);
        else this.sk.cursor(this.sk.ARROW);
    }

    /**
     * Coordinates line segment drawing in display and path data recording. Decides whether to record data point based on sampling rate method
     * NOTE: Always drawing mousePosLine creates smoother user experience when recording/drawing even when not recording actual data points
     */
    updateTranscription() {
        this.path.drawMousePosLine(this.gui.getFloorPlanContainer()); // Don't call this within testSampleRate block
        if (this.path.curPath.pointArray.length === 0 || this.sampleData()) this.recordPoint();
    }

    /**
     * Method to sample data by comparing video to endPointPath time in 2 ways:
     * (1) if mouse moves compare based on rounding to fixed decimal value for paths
     * (2) if stopped compare based on Math.round method, approximately every 1 second in movie
     */
    sampleData() {
        const [curVideoTime, curEndPointTime] = [this.videoPlayer.getCurTime(), this.path.getCurEndPoint().tPos];
        if (this.sk.mouseX !== this.sk.pmouseX || this.sk.mouseY !== this.sk.pmouseY) return this.path.round(curEndPointTime) < this.path.round(curVideoTime);
        else return Math.round(curEndPointTime) < Math.round(curVideoTime);
    }

    /**
     * Add correctly scaled positioning data for point to current path
     */
    recordPoint() {
        const [fpXPos, fpYPos] = this.floorPlan.getPositioningData(this.gui.getFloorPlanContainer());
        this.path.addPointToCurPath(fpXPos, fpYPos, this.videoPlayer.getCurTime());
    }

    drawAllData() {
        this.floorPlan.drawFloorPlan(this.gui.getFloorPlanContainer());
        this.videoPlayer.draw(this.gui.getVideoContainer());
        this.path.drawAllPaths(this.gui.getFloorPlanContainer(), this.floorPlan.getImg());
    }

    resetRecording() {
        if (this.allDataLoaded()) {
            this.stopRecording();
            this.path.clearCurPath();
            this.drawAllData();
        }
    }

    playPauseRecording() {
        if (this.isRecording) {
            this.videoPlayer.pause();
            this.isRecording = false;
            this.updateEndMarker();
        } else if (this.videoPlayer.getCurTime() < this.videoPlayer.getDuration()) {
            this.drawAllData(); // draw all data to erase end marker circle
            this.videoPlayer.play();
            this.isRecording = true;
        }
    }

    stopRecording() {
        this.videoPlayer.stop();
        this.isRecording = false;
    }

    /**
     * Coordinates rewinding of video, erasing of curPath data and updating display
     * If video has just started, rewind to 0
     */
    rewind() {
        if (this.videoPlayer.getCurTime() > this.jumpInSeconds) {
            const rewindToTime = this.path.getCurEndPoint().tPos - this.jumpInSeconds; // set time to rewind to based on last value in list
            this.path.rewind(rewindToTime);
            this.videoPlayer.rewind(rewindToTime);
        } else {
            this.path.rewind(0);
            this.videoPlayer.rewind(0);
        }
        if (this.isRecording) this.playPauseRecording();
        this.drawAllData();
        this.updateEndMarker();
    }

    /**
     * Fast forwards video and path data if not at beginning or end of video
     */
    fastForward() {
        if (this.videoPlayer.getCurTime() > 1 && this.videoPlayer.getCurTime() < this.videoPlayer.getDuration() - this.jumpInSeconds) {
            this.videoPlayer.fastForward(this.jumpInSeconds);
            this.path.fastForward(this.path.getCurEndPoint(), this.jumpInSeconds);
        }
    }

    updateEndMarker() {
        if (this.path.curPath.pointArray.length) this.path.drawEndMarker(this.path.getCurEndPoint(), this.gui.getFloorPlanContainer(), this.floorPlan.getImg());
    }

    loadFloorPlan(fileLocation) {
        if (this.floorPlanLoaded) this.floorPlan = null;
        this.floorPlan = new FloorPlan(this.sk, fileLocation);
    }

    loadVideo(fileLocation) {
        if (this.videoLoaded()) this.videoPlayer.destroy(); // if a video exists, destroy it
        this.videoPlayer = null;
        this.videoPlayer = new VideoPlayer(fileLocation, this.sk, this.gui.getVideoContainer());
    }

    /**
     * Called from VideoPlayer Class, updates all data/views after video is loaded
     */
    newVideoLoaded() {
        console.log("New Video Loaded");
        this.stopRecording(); // necessary to be able to draw starting frame before playing the video
        this.path.clearAllPaths();
        if (this.floorPlanLoaded()) this.floorPlan.drawFloorPlan(this.gui.getFloorPlanContainer()); // clear floor plan drawing area
    }

    newFloorPlanLoaded() {
        this.path.clearAllPaths();
        this.floorPlan.drawFloorPlan(this.gui.getFloorPlanContainer());
        if (this.videoLoaded()) this.stopRecording();
    }

    saveFile() {
        if (this.allDataLoaded() && this.path.curPath.pointArray.length > 0) {
            this.sk.saveTable(this.writeTable(this.path.curPath.pointArray), "transcript", "csv");
            //this.drawAllData();
        }
    }

    startNewPath() {
        if (this.allDataLoaded() && this.path.curPath.pointArray.length > 0) {
            this.sk.saveTable(this.writeTable(this.path.curPath.pointArray), "transcript", "csv");
            this.path.addCurPathToList();
            this.path.clearCurPath();
            this.stopRecording();
            this.drawAllData();
        }
    }

    writeTable = function (pointArray) {
        const headers = ["time", "x", "y"]; // Column headers for outputted .CSV movement files
        let table = new p5.Table();
        table.addColumn(headers[0]);
        table.addColumn(headers[1]);
        table.addColumn(headers[2]);
        for (const point of pointArray) {
            let newRow = table.addRow();
            newRow.setNum(headers[0], point.tPos);
            newRow.setNum(headers[1], point.fpXPos);
            newRow.setNum(headers[2], point.fpYPos);
        }
        return table;
    };

    /**
     * NOTE: set timeout is necessary to prevent user from hitting fastforward too quickly to allow data
     * to update in program
     */
    handleKeyPressed(keyValue) {
        if (this.allDataLoaded() && !this.isFastForwarding) {
            this.isFastForwarding = true;
            setTimeout(() => {
                this.isFastForwarding = false;
            }, 250);
            if (keyValue === "r" || keyValue === "R") this.rewind();
            else if (keyValue === "f" || keyValue === "F") this.fastForward();
        }
    }

    handleMousePressed() {
        if (this.overResizeSelector()) this.isResizing = true;
        else if (this.gui.overFloorPlan() && this.allDataLoaded()) this.playPauseRecording();
    }

    handleMouseDragged() {
        if (this.isResizing) {
            this.gui.resizeByUser();
            this.updateForResize(this.gui.getVideoContainer());
        }
    }

    handleMouseReleased() {
        this.isResizing = false;
    }

    resizeByWindow() {
        this.gui.resizeByWindow();
        this.sk.resizeCanvas(window.innerWidth, window.innerHeight);
        this.updateForResize(this.gui.getVideoContainer());
    }

    updateForResize(videoContainer) {
        if (this.videoLoaded()) this.videoPlayer.setScaledDimensions(videoContainer);
        if (this.allDataLoaded()) this.drawAllData();
        this.updateEndMarker();
    }

    /**
     * @param  {Any Type} data
     */
    dataIsLoaded(data) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    floorPlanLoaded() {
        return this.dataIsLoaded(this.floorPlan);
    }

    videoLoaded() {
        return this.dataIsLoaded(this.videoPlayer) && this.videoPlayer.isLoaded;
    }

    allDataLoaded() {
        return this.floorPlanLoaded() && this.videoLoaded();
    }

    overResizeSelector() {
        return !this.isRecording && this.gui.overResizeSelector();
    }
}
