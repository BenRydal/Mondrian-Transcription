export class SketchUI {

    constructor(sketch) {
        this.sk = sketch;
        this.floorPlanContainer = this.createFloorPlanContainer(this.sk.width / 2, this.sk.width / 2);
        this.videoContainer = this.createVideoContainer(this.sk.width / 2);
    }


    resizeByUser() {
        this.videoContainer = this.createVideoContainer(this.sk.mouseX);
        this.floorPlanContainer = this.createFloorPlanContainer(this.sk.mouseX, this.sk.width - this.sk.mouseX);
    }

    resizeByWindow() {
        this.videoContainer = this.createVideoContainer(window.innerWidth * (this.videoContainer.width / this.sk.width));
        this.floorPlanContainer = this.createFloorPlanContainer(window.innerWidth * (this.floorPlanContainer.xPos / this.sk.width), window.innerWidth * (this.floorPlanContainer.width / this.sk.width));
    }

    drawCenterLine() {
        this.sk.stroke(0);
        this.sk.strokeWeight(2);
        this.sk.line(this.videoContainer.width, 0, this.videoContainer.width, this.videoContainer.height);
    }

    drawWhiteBackground() {
        this.sk.fill(255);
        this.sk.stroke(255);
        this.sk.rect(0, 0, this.sk.width, this.sk.height);
    }

    createFloorPlanContainer(xPos, width) {
        return {
            width: width,
            height: this.sk.height,
            xPos: xPos,
            yPos: 0
        }
    }

    createVideoContainer(width) {
        return {
            width: width,
            height: this.sk.height,
            xPos: 0,
            yPos: 0
        }
    }

    overResizeSelector() {
        const selectorSpacing = 3;
        return this.overRect(this.videoContainer.width - selectorSpacing, 0, selectorSpacing * 2, this.videoContainer.height);
    }

    overFloorPlan() {
        return this.overRect(this.floorPlanContainer.xPos, this.floorPlanContainer.yPos, this.floorPlanContainer.width, this.floorPlanContainer.height);
    }

    overRect(x, y, boxWidth, boxHeight) {
        return this.sk.mouseX >= x && this.sk.mouseX <= x + boxWidth && this.sk.mouseY >= y && this.sk.mouseY <= y + boxHeight;
    }

    getVideoContainer() {
        return this.videoContainer;
    }

    getFloorPlanContainer() {
        return this.floorPlanContainer;
    }
}