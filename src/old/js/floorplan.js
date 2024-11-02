export class FloorPlan {

    constructor(sketch, fileLocation) {
        this.sk = sketch;
        this.img = this.sk.loadImage(fileLocation, () => {
            this.sk.mediator.newFloorPlanLoaded();
            URL.revokeObjectURL(fileLocation);
            console.log("New Floor Plan Loaded");
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }


    drawFloorPlan(floorPlanContainer) {
        this.sk.fill(255); // draw white screen in case floor plan image has any transparency
        this.sk.stroke(255);
        this.sk.rect(floorPlanContainer.xPos, floorPlanContainer.yPos, floorPlanContainer.width, floorPlanContainer.height);
        this.sk.image(this.img, floorPlanContainer.xPos, floorPlanContainer.yPos, floorPlanContainer.width, floorPlanContainer.height);
    }

    /**
     * NOTE: First, constrain mouse x/y pos to floor plan display container
     * then, subtract floorPlan container from constrained mouse x/y pos to set to 0,0 origin and scale x/y positions to input floor plan width / height 
     */
    getPositioningData(container) {
        const mouseXPos = (this.sk.constrain(this.sk.mouseX, container.xPos, container.xPos + container.width));
        const mouseYPos = (this.sk.constrain(this.sk.mouseY, container.yPos, container.yPos + container.height));
        const fpXPos = (mouseXPos - container.xPos) * (this.img.width / container.width);
        const fpYPos = (mouseYPos - container.yPos) * (this.img.height / container.height);
        return [fpXPos, fpYPos];
    }

    getImg() {
        return this.img;
    }
}