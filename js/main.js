// Update setVIdeo with proper anonymous functino for video load
// when you rewind, pause video, don't keep playing so you can set your pointer

// DATA
let paths = []; // holds all recorded path files
let curPath; // current path to record

// Path object has x/y position and time lists (each recorded file)
class Path {
  xPos = [];
  yPos = [];
  tPos = [];
}

let dataUpdate; // holds methods to update data recording and video
let reSetAllData = true;
let curFileToOutput = 0; // current file number to write to output
const fileHeaders = ["time", "x", "y"];

// FLOOR PLAN
let floorPlan; // floor plan image file
let inputFloorPlanWidth, inputFloorPlanHeight; // real pixel width and height of floorPlan image file

// VIDEO
let movie; // video file
let movieDuration; // video duration set in loadData from video data
let recording = false; // controls path recording and video playing (always synchronized)
let videoJumpValue = 5; // value in seconds to ff or rewind

// GUI
let font_PlayfairReg, font_PlayfairItalic, font_PlayfairBold, font_Lato;
let movieLoaded = false,
  floorPlanLoaded = false;
let displayFloorplanWidth, displayFloorplanHeight, displayVideoWidth, displayVideoHeight, displayKeysWidth, displayKeysHeight;
let displayFloorplanXpos, displayFloorplanYpos, displayVideoXpos, displayVideoYpos, displayKeysXpos, displayKeysYpos;
let floorPlanBackgroundCol = 225,
  videoBackgroundColor = 125,
  keysBackgroundColor = 255;
let colorShades = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];
let spacing = 50; // general spacing variable
let pathWeight = 5;
let curPathColor = 0;

// TITLE
let keyTextSize, infoTextSize;
let infoMsg = "MONDRIAN TRANSCRIPTION\nby Ben Rydal Shapiro & contributers\nbuilt with p5.js";
let descMSG = "Hi there! This is a beta version of Mondrian Transcription, a method to precisely transcribe movement from video data. To get started, use the top buttons to upload a floor plan image file and a video file. Then, use the key codes below to interact with the video and use your cursor/mouse to draw on the floor plan. As you interact with the video and simultaneously draw on the floor plan, movement is recorded. You can save this movement as a .CSV file anytime and then draw/record another movement path.\n\nPlay/Pause (p)\nFast-Forward (f)\nRewind (b)\nReset (r)\nSave Movement File (s)"

function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
  frameRate(30);
  setGUIWindows();
  curPath = new Path();
  dataUpdate = new UpdateData();
  loadFonts();
}

function draw() {
  if (floorPlanLoaded && movieLoaded) setDrawingScreen();
  else setLoadDataScreen();
}

function setLoadDataScreen() {
  drawGUIWindows();
  drawKeys();
}

function setDrawingScreen() {
  if (reSetAllData) dataUpdate.reDrawAllData(); // Runs once after data is initially loaded or file is written
  if (recording) dataUpdate.prepareRecording(); // records data and updates visualization if in record mode
}