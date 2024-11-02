export class DomHandler {

    constructor(mediator) {
        this.mediator = mediator;
    }

    handleIntroButton() {
        const element = document.querySelector('.how-to-container');
        if (element.style.display === 'none') element.style.display = 'block';
        else element.style.display = 'none';
    }

    handleSaveButton() {
        this.mediator.writeFile();
    }

    /**
     * Handles asynchronous loading and error handling of floor plan image file
     * @param  {PNG/JPG File} input
     */
    handleFloorPlanButton() {
        const input = document.getElementById("input-floorplan");
        this.mediator.loadFloorPlan(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Handles async loading of video file and creates movie object
     * @param  {.MP4 File} input
     */
    handleVideoButton() {
        const input = document.getElementById("input-video");
        this.mediator.loadVideo(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    handleClearButton() {
        this.mediator.resetRecording();
    }
}