import { Path } from './path';
import { VideoPlayer } from './videoPlayer';

/*
Mediator class coordinates calls to 4 other classes including P5 sk
Contains methods for procedural updates, testing data, getters/setters, and loading data (called from Controller)
*/
export class Mediator {
    private sk: any;
    private path: Path;
    private videoPlayer: any;
    private floorPlan: any;
    private isRecording: boolean;
    private isInfoShowing: boolean;
    private jumpInSeconds: number;

    constructor(sketch: any) {
        this.sk = sketch;
        this.path = new Path();
        this.videoPlayer = null;
        this.floorPlan = null;
        this.isRecording = false; // indicates recording mode
        this.isInfoShowing = true; // indicates if intro message showing
        this.jumpInSeconds = 5; // seconds value to fast forward and rewind path/video data
    }

    handleKeyPressed(keyValue: string) {
        if (this.allDataLoaded()) {
            if (keyValue === 'r' || keyValue === 'R') this.rewind();
            else if (keyValue === 'f' || keyValue === 'F') this.fastForward();
        }
    }

    handleMousePressed() {
        if (this.allDataLoaded()) {
            this.playPauseRecording();
            if (this.isInfoShowing) this.updateIntro(); // prevent info screen from showing while recording for smooth user interaction
        }
    }

    /**
     * Handles program flow/method calls based on what data has been loaded
     */
    updateDrawLoop() {
        if (this.allDataLoaded()) {
            this.sk.drawVideoFrame(this.videoPlayer, this.videoPlayer.curTime);
            if (this.isRecording) this.updateTranscription();
            if (this.isInfoShowing) this.sk.drawIntroScreen();
        } else {
            this.sk.drawLoadDataBackground();
            if (this.floorPlanLoaded()) this.sk.drawFloorPlan(this.floorPlan);
            else if (this.videoLoaded()) this.sk.drawVideoFrame(this.videoPlayer, this.videoPlayer.curTime);
            if (this.isInfoShowing) this.sk.drawIntroScreen();
        }
    }

    /**
     * Coordinates video and line segment drawing in display. Decides whether to record data point based on sampling rate method
     */
    updateTranscription() {
        this.sk.drawLineSegment(this.path.curPath); // Don't call this within testSampleRate block
        if (this.sampleData()) this.updateCurPath();
    }

    /**
     * Method to sample data in 2 ways
     * (1) if mouse moves compare based on rounding decimal value for paths
     * (2) if stopped compare based on Math.round method, approximately every 1 second in movie
     */
    sampleData() {
        if (this.path.curPath.pointArray.length === 0) return true; // always return true if first data point
        else if (this.sk.mouseX !== this.sk.pmouseX || this.sk.mouseY !== this.sk.pmouseY) return this.path.round(this.path.curPathEndPoint.tPos) < this.path.round(this.videoPlayer.curTime);
        else return Math.round(this.path.curPathEndPoint.tPos) < Math.round(this.videoPlayer.curTime);
    }

    /**
     * Add correctly scaled positioning data to current path
     */
    updateCurPath() {
        const [mouseXPos, mouseYPos, pointXPos, pointYPos] = this.sk.getPositioningData(this.floorPlan);
        const time = this.videoPlayer.curTime;
        this.path.addPointToCurPath(mouseXPos, mouseYPos, pointXPos, pointYPos, time);
    }

    updateIntro() {
        if (this.isInfoShowing && this.allDataLoaded()) this.updateAllData();
        if (this.isInfoShowing) this.isInfoShowing = false;
        else this.isInfoShowing = true;
    }

    updateAllData() {
        this.sk.drawFloorPlan(this.floorPlan);
        this.sk.drawVideoFrame(this.videoPlayer, this.videoPlayer.curTime);
        for (const path of this.path.paths) this.sk.drawPath(path); // update all recorded paths
        this.sk.drawPath(this.path.curPath); // update current path last
    }

    resetCurRecording() {
        if (this.allDataLoaded()) {
            this.stopRecording();
            this.path.clearCurPath();
            this.updateAllData();
        }
    }

    playPauseRecording() {
        if (this.isRecording) {
            this.videoPlayer.pause();
            this.isRecording = false;
            if (this.path.curPath.pointArray.length > 0) this.sk.drawCurPathEndPoint(this.path.curPathEndPoint);
        } else if (this.testVideoTimeForRecording()) {
            this.updateAllData(); // update all data to erase curPathBug
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
     */
    rewind() {
        if (this.testVideoForRewind()) {
            const rewindToTime = this.path.curPathEndPoint.tPos - this.jumpInSeconds; // set time to rewind to based on last value in list
            this.path.rewind(rewindToTime);
            this.videoPlayer.rewind(rewindToTime);
        } else {
            this.path.rewind(0);
            this.videoPlayer.rewind(0);
        }
        if (this.isRecording) this.playPauseRecording(); // pause recording and video if currently recording
        this.updateAllData();
        if (this.path.curPath.pointArray.length > 0) this.sk.drawCurPathEndPoint(this.path.curPathEndPoint);
    }

    /**
     * Coordinates fast forwarding of movie and path data, if movie not right at start or near end
     */
    fastForward() {
        if (this.testVideoTimeForFastForward()) {
            this.videoPlayer.fastForward(this.jumpInSeconds);
            this.path.fastForward(this.jumpInSeconds);
        }
    }

    loadVideo(fileLocation: any) {
        if (this.videoLoaded()) this.videoPlayer.destroy(); // if a video exists, destroy it
        this.videoPlayer = new VideoPlayer(fileLocation, this.sk); // create new videoPlayer
    }

    /**
     * Called from VideoPlayer Class, updates all data/views after video is loaded
     */
    newVideoLoaded() {
        this.stopRecording(); // necessary to be able to draw starting frame before playing the video
        this.path.clearAllPaths();
        if (this.floorPlanLoaded()) this.sk.drawFloorPlan(this.floorPlan); // clear floor plan drawing area
    }

    loadFloorPlan(fileLocation: any) {

        this.sk.loadImage(fileLocation, (img: any) => {
            this.newFloorPlanLoaded(img);
            URL.revokeObjectURL(fileLocation);
        }, (e: any) => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    newFloorPlanLoaded(img: any) {
        console.log("New Floor Plan Loaded");
        this.floorPlan = img;
        this.path.clearAllPaths();
        this.sk.drawFloorPlan(this.floorPlan);
        if (this.videoLoaded()) this.stopRecording();
    }

    writeFile() {
        if (this.allDataLoaded() && this.path.curPath.pointArray.length > 0) {
            this.sk.saveTable(this.sk.writeTable(this.path.curPath.pointArray), "Path_" + this.path.curFileToOutput, "csv");
            this.path.curFileToOutput++;
            this.path.addCurPathToList();
            this.path.clearCurPath();
            this.stopRecording();
            this.updateAllData();
        }
    }

    /**
     * @param  {Any Type} data
     */
    dataIsLoaded(data: any) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    floorPlanLoaded() {
        return this.dataIsLoaded(this.floorPlan);
    }

    videoLoaded() {
        return (this.dataIsLoaded(this.videoPlayer) && this.dataIsLoaded(this.videoPlayer.movieDiv));
    }

    allDataLoaded() {
        return this.floorPlanLoaded() && this.videoLoaded();
    }

    testVideoTimeForRecording() {
        return this.videoPlayer.curTime < this.videoPlayer.duration;
    }

    testVideoTimeForFastForward() {
        return this.videoPlayer.curTime > 0 && (this.videoPlayer.curTime < this.videoPlayer.duration - this.jumpInSeconds);
    }

    testVideoForRewind() {
        return this.videoPlayer.curTime > this.jumpInSeconds;
    }
}