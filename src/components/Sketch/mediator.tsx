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

    constructor(sketch: any) {
        this.sk = sketch;
        this.path = new Path();
        this.videoPlayer = null;
        this.floorPlan = null;
        this.isRecording = false; // Boolean to indicate recording
    }

    // ** ** ** ** UPDATE METHODS ** ** ** **
    /**
     * Coordinates video and line segment drawing in display. Decides whether to record data point based on sampling rate method
     */
    updateRecording() {
        this.updateVideoFrame();
        this.sk.drawLineSegment(this.path.getCurrPath()); // Apparently, this should not be called within testSampleRate block
        if (this.testSampleRate()) this.updateCurPath();
    }

    /**
     * Method to sample data in 2 ways
     * (1) if mouse moves sample at rate of 2 decimal points
     * (2) if stopped sample at rate of 0 decimal points, approximately every 1 second in movie
     */
    testSampleRate() {
        if (this.path.getCurrPath().tPos.length === 0) return true;
        else if (this.sk.mouseX !== this.sk.pmouseX || this.sk.mouseY !== this.sk.pmouseY) return +(this.path.getCurrPath().tPos[this.path.getCurrPath().tPos.length - 1].toFixed(2)) < +(this.videoPlayer.movieDiv.time().toFixed(2));
        else return +(this.path.getCurrPath().tPos[this.path.getCurrPath().tPos.length - 1].toFixed(0)) < +(this.videoPlayer.movieDiv.time().toFixed(0));
    }

    updateCurPathBug() {
        if (this.path.getCurrPath().xPos.length > 0) this.sk.drawCurPathBug(this.path.getCurrPath().xPos[this.path.getCurrPath().xPos.length - 1], this.path.getCurrPath().yPos[this.path.getCurrPath().yPos.length - 1]);
    }

    /**
     * Adds properly scaled data point from input floorPlan to current path
     */
    updateCurPath() {
        const [xPos, yPos] = this.sk.getScaledMousePos(this.floorPlan);
        const time = +this.videoPlayer.movieDiv.time().toFixed(2);
        this.path.addPoint({
            xPos,
            yPos,
            time
        });
    }
    updateAllData() {
        this.updateFloorPlan();
        this.updateVideoFrame();
        this.sk.drawAllPaths(this.path.getPaths(), this.path.getCurrPath());
    }

    updateFloorPlan() {
        this.sk.drawFloorPlan(this.floorPlan);
    }

    updateVideoFrame() {
        this.sk.drawVideoFrame(this.videoPlayer);
        this.sk.drawVideoTimeLabel(this.videoPlayer.movieDiv.time());
    }

    resetCurRecording() {
        if (this.allDataLoaded()) {
            this.stopRecording();
            this.path.clearCurPath();
            this.updateAllData();
        }
    }

    /**
     * Coordinates rewinding of video and erasing of currPath data and updating display
     */
    rewind() {
        // Set time to rewind to base on last time value in list - videoPlayer.videoJumpValue
        const rewindToTime = this.path.getCurrPath().tPos[this.path.getCurrPath().tPos.length - 1] - this.videoPlayer.videoJumpValue;
        this.path.rewind(rewindToTime);
        this.videoPlayer.rewind(rewindToTime);
        if (this.getIsRecording()) this.playPauseRecording(); // pause recording and video if currently recording
        this.updateAllData();
    }

    /**
     * Coordinates fast forwarding of movie and path data, if movie not right at start or near end
     */
    fastForward() {
        if (this.videoPlayer.movieDiv.time() > 0 && (this.videoPlayer.movieDiv.time() < this.videoPlayer.movieDiv.duration() - this.videoPlayer.videoJumpValue)) {
            this.videoPlayer.fastForward();
            this.path.fastForward(this.videoPlayer.videoJumpValue);
        }
    }

    stopRecording() {
        this.videoPlayer.stop();
        this.setIsRecording(false);
    }

    playPauseRecording() {
        if (this.getIsRecording()) {
            this.videoPlayer.pause();
            this.setIsRecording(false);
        } else {
            this.updateAllData(); // update all data to erase rewind bug
            this.videoPlayer.play();
            this.setIsRecording(true);
        }
    }

    // ** ** ** ** DATA LOADING METHODS ** ** ** **

    loadVideo(fileLocation: any) {
        if (this.videoLoaded()) this.videoPlayer.destroy(); // if a video exists, destroy it
        this.videoPlayer = new VideoPlayer(fileLocation, this.sk); // create new videoPlayer
    }
    /**
     * Tests if new video has a duration (additional formatting test) and updates all data/views if so or destroys video and alerts user if not
     */
    newVideoLoaded() {
        console.log("New Video Loaded");
        this.path.clearAllPaths();
        this.stopRecording(); // necessary to be able to draw starting frame before playing the video
        this.updateVideoFrame(); // after video loaded, draw first frame to display it
        if (this.floorPlanLoaded()) this.updateFloorPlan();
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

    newFloorPlanLoaded(img: File) {
        console.log("New Floor Plan Loaded");
        this.floorPlan = img;
        this.path.clearAllPaths();
        this.updateFloorPlan();
        if (this.videoLoaded()) {
            this.stopRecording();
            this.updateVideoFrame();
        }
    }

    writeFile() {
        if (this.allDataLoaded() && this.path.getCurrPath().xPos.length > 0) {
            this.sk.saveTable(this.path.getTable(), "Path_" + this.path.getCurrFileToOutput(), "csv");
            this.path.setCurrFileToOutput(this.path.getCurrFileToOutput() + 1);
            this.path.addPath();
            this.path.clearCurPath();
            this.stopRecording();
            this.updateAllData();
        }
    }

    // ** ** ** ** TEST DATA METHODS ** ** ** **

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
        return this.dataIsLoaded(this.videoPlayer);
    }

    allDataLoaded() {
        return this.dataIsLoaded(this.floorPlan) && this.dataIsLoaded(this.videoPlayer);
    }

    // ** ** ** ** GETTERS/SETTERS ** ** ** **

    getFloorPlanWidth() {
        return this.floorPlan.width;
    }

    getFloorPlanHeight() {
        return this.floorPlan.height;
    }

    getIsRecording() {
        return this.isRecording;
    }

    setIsRecording(value: boolean) {
        this.isRecording = value;
    }
}