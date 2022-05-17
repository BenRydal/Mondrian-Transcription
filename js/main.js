/*
Launches Mondrian Transcription Software in p5 instance mode.
Mediator coordinates recording and displaying of Path and video data across different classes.
Data is displayed on the Canvas element.
DomHandler handles user input from Dom elements.
*/

import {
    Mediator
} from './mediator.js';
import {
    DomHandler
} from './dom-handler.js';

const mondrian = new p5((sk) => {

    sk.preload = function () {
        sk.font_Lato = sk.loadFont("data/fonts/Lato-Light.ttf");
    }

    sk.setup = function () {
        sk.canvas = sk.createCanvas(window.innerWidth, window.innerHeight);
        sk.canvas.parent('sketch-holder');
        sk.textFont(sk.font_Lato, 20);
        sk.mediator = new Mediator(sk);
        sk.domHandler = new DomHandler(sk.mediator);
        sk.addListeners();
    }

    sk.draw = function () {
        sk.mediator.updateProgram();
    }

    sk.addListeners = function () {
        document.getElementById("button-intro").addEventListener("click", sk.domHandler.handleIntroButton.bind(sk.domHandler));
        document.getElementById("input-floorplan").addEventListener("change", sk.domHandler.handleFloorPlanButton.bind(sk.domHandler));
        document.getElementById("input-video").addEventListener("change", sk.domHandler.handleVideoButton.bind(sk.domHandler));
        document.getElementById("button-save").addEventListener("click", sk.domHandler.handleSaveButton.bind(sk.domHandler));
        document.getElementById("button-clear").addEventListener("click", sk.domHandler.handleClearButton.bind(sk.domHandler));
    }

    /**
     * While wrapped in a P5 instance, keyPressed and mousePressed P5 methods operate globally on the window (there can't be two of these methods)
     */
    sk.keyPressed = function () {
        sk.mediator.handleKeyPressed(sk.key);
    }

    sk.mousePressed = function () {
        sk.mediator.handleMousePressed();
    }

    sk.mouseDragged = function () {
        sk.mediator.handleMouseDragged();
    }

    sk.mouseReleased = function () {
        sk.mediator.handleMouseReleased();
    }

    sk.windowResized = function () {
        sk.mediator.resizeByWindow();
    }
});