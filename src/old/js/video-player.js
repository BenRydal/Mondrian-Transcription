export class VideoPlayer {

    /**
     * @param  {String} fileLocation
     * @param  {P5 Instance} sketch
     * @param  {VideoContainer} videoContainer
     */

    constructor(fileLocation, sketch, videoContainer) {
        this.sk = sketch;
        this.isLoaded = false; // IMPORTANT to use a boolean test later in program to deal with a safari bug
        this.scaledWidth = null; // Rescaled pixel size of video to fit display container
        this.scaledHeight = null;
        this.movieDiv = this.sk.createVideo(fileLocation, () => {
            this.movieDiv.id('moviePlayer');
            this.movieDiv.hide(); // hide html5 video element as program use p5 image drawing methods to draw video frames
            this.setScaledDimensions(videoContainer);
            document.getElementById('moviePlayer').onended = () => this.sk.mediator.isRecording = false; // end program recording when movie ends
            this.isLoaded = true;
            this.sk.mediator.newVideoLoaded();
        });
    }

    //////***** Public Methods *****//////
    setScaledDimensions(bounds) {
        [this.scaledWidth, this.scaledHeight] = this.scaleRectToBounds(this.movieDiv, bounds);
    }

    stop() {
        this.movieDiv.stop(); // sets movie time to 0
    }

    play() {
        this.movieDiv.play();
    }

    pause() {
        this.movieDiv.pause();
    }

    /**
     * @param  {Float/Number} jumpInSeconds
     */
    fastForward(jumpInSeconds) {
        const curTime = this.movieDiv.time();
        this.movieDiv.time(curTime + jumpInSeconds);
    }

    /**
     * @param  {Float/Number} rewindToTime
     */
    rewind(rewindToTime) {
        this.movieDiv.time(rewindToTime);
    }

    destroy() {
        this.movieDiv.remove();
    }

    getCurTime() {
        return this.movieDiv.time();
    }

    getDuration() {
        return this.movieDiv.duration();
    }

    draw(videoContainer) {
        this.drawFrame(videoContainer);
        this.drawTimeLabel(videoContainer);
    }

    //////***** Private Methods *****//////
    drawFrame(videoContainer) {
        this.sk.fill(255); // first draw white background to hide any previous/older frames, then draw frame
        this.sk.stroke(255);
        this.sk.rect(videoContainer.xPos, videoContainer.yPos, videoContainer.width, videoContainer.height); // erases previous video frames from other loaded videos that can be different size than current frames
        this.sk.image(this.movieDiv, videoContainer.xPos, videoContainer.yPos, this.scaledWidth, this.scaledHeight);
    }

    drawTimeLabel(videoContainer) {
        const curVideoTime = this.getCurTime();
        const labelSpacing = 30;
        const minutes = Math.floor(curVideoTime / 60);
        const seconds = Math.floor(curVideoTime - minutes * 60);
        const label = minutes + " minutes  " + seconds + " seconds";
        this.sk.fill(0);
        this.sk.noStroke();
        this.sk.text(label, videoContainer.xPos + labelSpacing / 2, videoContainer.yPos + labelSpacing);
    }

    scaleRectToBounds(rect, bounds) {
        const rectRatio = rect.width / rect.height;
        const boundsRatio = bounds.width / bounds.height;
        if (rectRatio > boundsRatio) return [bounds.width, rect.height * (bounds.width / rect.width)]; // Fit to width if rect is more landscape than bounds
        else return [rect.width * (bounds.height / rect.height), bounds.height]; // Fit to height if rect is more portrait than bounds
    }
}