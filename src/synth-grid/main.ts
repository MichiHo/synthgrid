import "./style.scss";

import {
  AudioBlock,
  blockTypes,
  GainBlock,
  OscillatorBlock,
  OutputBlock,
  ReverbBlock,
} from "./blocks";
import { SynthGrid, SynthGridSlot } from "./synthGrid";
import * as utils from "./utils";
import { BoxSlider } from "./ui/boxSlider";
import deepmerge from "deepmerge";

let gridElements: HTMLElement[][];
let mainElement: HTMLElement;

const slotSize = 15;
const slotSizeCSS = `${slotSize}px`;

/**
 * Build html visualization of Synth Grid
 */
function makeGrid(element: HTMLElement, width = 40, height = 55) {
  element.innerHTML = "";

  let gameElement = document.createElement("table");
  gameElement.className = "synth-grid";
  gridElements = [];
  for (let y = 0; y < height; y++) {
    gridElements.push([]);
    let rowElement = document.createElement("tr");
    for (let x = 0; x < width; x++) {
      let cellElement = document.createElement("td");
      cellElement.setAttribute("data-x", x.toFixed(0));
      cellElement.setAttribute("data-y", y.toFixed(0));
      cellElement.id = `grid-item-${x}-${y}`;
      gridElements[y][x] = cellElement;
      rowElement.appendChild(cellElement);
    }
    gameElement.appendChild(rowElement);
  }
  element.appendChild(gameElement);
}

function backgroundImageSrc(slot: SynthGridSlot | AudioBlock) {
  let filename = "empty";
  if (slot instanceof SynthGridSlot) {
    if (slot.type === "block") {
      filename = "block";

      if (slot.block.hasInput) filename += "_inputs";
      else filename += "_source";

      if (slot.inTopSlot) {
        if (slot.inLeftSlot) filename += "_both";
        else filename += "_up";
      } else if (slot.inLeftSlot) filename += "_left";
    } else {
      filename = slot.type;
    }
  } else if (slot instanceof AudioBlock) {
    filename = "block";
    if (slot.hasInput) filename += "_inputs";
    else filename += "_source";

    filename += "_both";
  }
  return `./assets/icons/${filename}.png`;
}

function makeBlockDropTarget(
  audioCtx: AudioContext,
  element: HTMLElement,
  callback: (block: AudioBlock) => void
) {
  // dragend comes after dragend on the dragged element, so the old element can be removed before adding the new one!
  element.addEventListener("drop", (ev) => {
    //try {
    let block = AudioBlock.fromConfig(
      audioCtx,
      JSON.parse(ev.dataTransfer.getData("text/plain"))
    );
    callback(block);
    // } catch (err) {
    // }
    ev.stopImmediatePropagation();
  });
  element.addEventListener("dragenter", (ev) => ev.preventDefault());
  element.addEventListener("dragover", (ev) => ev.preventDefault());
}

/**
 * Make a HtmlElement represent a block and support dragging
 * @param {HtmlElement} el Element to represent a block
 * @param {AudioBlock} block Block to represent
 */
function blockSetup(
  el: HTMLElement,
  block: AudioBlock,
  dragend = (ev: MouseEvent) => {},
  editable = true
) {
  el.setAttribute("title", block.name);
  el.classList.add("block-" + block.type);
  if (block.playable) {
    el.classList.add("playable");
  }
  let overlay : HTMLElement;
  let dragObj : HTMLElement;
  let dragging = false;
  el.addEventListener("mouseover", () => {
    if (dragging) {
      dragging = false;
      return;
    }
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "block-overlay-wrapper";
      let overlayInner = document.createElement("div");
      overlayInner.className = "block-overlay block-" + block.type;
      block.createUI(overlayInner, editable);
      overlay.appendChild(overlayInner);
      el.appendChild(overlay);

      // DRAG SOURCE EVENTS
      dragObj = document.createElement("div");
      dragObj.style.width = slotSizeCSS;
      dragObj.style.height = slotSizeCSS;
      dragObj.style.left = "0px";
      dragObj.style.top = "0px";
      dragObj.style.position = "absolute";
      dragObj.style.zIndex = "10000";
      dragObj.draggable = true;
      dragObj.addEventListener("dragstart", (ev) => {
        dragging = true;
        mainElement.classList.add("dragging");
        hideOverlay();
        const cssObj = window.getComputedStyle(el, null);

        dragObj.style.backgroundColor =
          cssObj.getPropertyValue("background-color");
        dragObj.style.backgroundImage =
          cssObj.getPropertyValue("background-image");
        let str = JSON.stringify(block.config);
        ev.dataTransfer.setData("text/plain", str);
        dragObj.addEventListener("dragend", (ev) => {
          mainElement.classList.remove("dragging");
          dragObj.remove();
          dragObj = null;
          if (dragend?.call) dragend(ev);
        });
      });
      el.appendChild(dragObj);
    }
  });
  let hideOverlay = () => {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (dragObj && !dragging) {
      dragObj.remove();
      dragObj = null;
    }
  };
  el.addEventListener("mouseleave", hideOverlay);
}

function gridUpdate(audioCtx : AudioContext, grid : SynthGrid, config : any) {
  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      let gridSlot = grid.grid[x][y];
      let el = gridElements[y][x];
      el.className = "slot slot-" + gridSlot.type;
      el.style.backgroundImage = `url('${backgroundImageSrc(gridSlot)}')`;
      el.setAttribute("title", gridSlot.type);

      // DRAG TARGET EVENTS
      makeBlockDropTarget(audioCtx, el, (block) => {
        console.log(`recreating dropped element at ${x},${y}`);
        grid.insert(x, y, block);
      });

      // HOVER & DROP
      if (gridSlot.type === "block") {
        blockSetup(el, gridSlot.block, (ev) => {
          if (!ev.ctrlKey) {
            console.log(`remove dragged element at ${x},${y}`);
            grid.remove(x, y);
          }
        });
      }
    }
  }
}

const defaultConfig = {
  height: 40,
  width: 30,
};

/**
 * Setup the whole app.
 * @param {HTMLElement} rootElement
 */
export function show(rootElement : HTMLElement, userConfig = {}) {
  // ALGO SETUP
  let config = deepmerge(defaultConfig, userConfig);
  const audioCtx = new window.AudioContext();
  const masterGain = new GainNode(audioCtx);
  masterGain.gain.value = 0.2;
  masterGain.connect(audioCtx.destination);
  audioCtx.resume();

  let synthGrid = new SynthGrid(
    config.width,
    config.height,
    audioCtx,
    masterGain
  );

  let testSetupSpec = function* () {
    synthGrid.clear();
    synthGrid.insert(0, 0, new OscillatorBlock(audioCtx));
    synthGrid.insert(2, 0, new ReverbBlock(audioCtx));
    synthGrid.insert(0, 4, new OscillatorBlock(audioCtx));
    synthGrid.insert(1, 3, new OscillatorBlock(audioCtx));
    synthGrid.insert(2, 4, new GainBlock(audioCtx));
    synthGrid.insert(2, config.height - 1, new GainBlock(audioCtx));
    synthGrid.insert(
      config.width - 1,
      config.height - 1,
      new OutputBlock(audioCtx)
    );
  };
  let testSetup = testSetupSpec();
  testSetup.next();

  // UI
  let title = document.createElement("h2");
  title.textContent = "Synth Grid";
  rootElement.appendChild(title);

  let controlsBar = document.createElement("div");
  controlsBar.className = "controls-bar";
  {
    let playBtn = document.createElement("button");
    playBtn.textContent = "Play";
    playBtn.className = "play-btn";
    playBtn.onmousedown = (ev) => {
      synthGrid.playSound();
      mainElement.classList.add("playing");
    };
    playBtn.onmouseup = (ev) => {
      synthGrid.stopSound();
      mainElement.classList.remove("playing");
    };
    controlsBar.appendChild(playBtn);
  }
  {
    let testSetupBtn = document.createElement("button");
    testSetupBtn.textContent = "Test setup";
    testSetupBtn.onclick = (ev) => {
      testSetup.next();
    };
    controlsBar.appendChild(testSetupBtn);
  }
  {
    let resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.onclick = (ev) => {
      synthGrid.clear();
      testSetup = testSetupSpec();
    };
    controlsBar.appendChild(resetBtn);
  }
  {
    // test tone
    let testToneBtn = document.createElement("button");
    testToneBtn.textContent = "Test tone";
    let testTone : OscillatorNode;
    testToneBtn.onmousedown = () => {
      let time = audioCtx.currentTime;
      if (testTone) {
        testTone.stop(time);
        testTone = null;
      }
      testTone = new OscillatorNode(audioCtx);
      testTone.connect(masterGain);
      testTone.type = "sawtooth";
      testTone.frequency.setValueAtTime(440, 0.0);
      testTone.start(time);
    };
    testToneBtn.onmouseup = () => {
      if (testTone) {
        let time = audioCtx.currentTime;
        testTone.stop(time);
        testTone = null;
      }
    };
    testToneBtn.onmouseleave = testToneBtn.onmouseup;
    controlsBar.appendChild(testToneBtn);
  }
  {
    let masterGainElement = document.createElement("div");
    masterGainElement.className = "gain-slider";
    let masterGainSlider = new BoxSlider(masterGainElement, {
      format: (v : number) => `${v.toFixed(1)}`,
      startVal: utils.linToDb(masterGain.gain.value),
      minVal: -30.0,
      maxVal: 0.0,
      title: "Master",
    });
    masterGainSlider.onslide = (val) => {
      masterGain.gain.value = utils.dbToLin(val);
    };
    controlsBar.appendChild(masterGainElement);
  }
  rootElement.appendChild(controlsBar);

  // grid UI
  mainElement = document.createElement("div");
  mainElement.className = "synth-grid-main";
  rootElement.appendChild(mainElement);
  makeGrid(mainElement, config.width, config.height);
  synthGrid.onchange = () => gridUpdate(audioCtx, synthGrid, config);
  gridUpdate(audioCtx, synthGrid, config);

  // Palette TODO
  {
    let paletteDiv = document.createElement("aside");
    paletteDiv.className = "synth-grid-palette";
    {
      let title = document.createElement("h1");
      title.textContent = "Palette";
      paletteDiv.appendChild(title);
    }

    makeBlockDropTarget(audioCtx, paletteDiv, (block) => {});
    for (let BlockType of blockTypes) {
      let name = BlockType.name;
      let subpaletteDiv = document.createElement("div");
      subpaletteDiv.className = "synth-grid-subpalette";
      let title = document.createElement("h2");

      {
        // Title with draggable default block
        let defaultElement = document.createElement("div");
        let defaultBlock = new BlockType(audioCtx);
        defaultBlock.name = "default";
        defaultElement.style.backgroundImage = `url('${backgroundImageSrc(
          defaultBlock
        )}')`;
        defaultElement.className = "slot";
        blockSetup(defaultElement, defaultBlock, undefined, false);
        title.appendChild(defaultElement);
        let titleSpan = document.createElement("span");
        titleSpan.textContent = defaultBlock.type;
        title.appendChild(titleSpan);
        subpaletteDiv.appendChild(title);
      }

      paletteDiv.appendChild(subpaletteDiv);
    }
    mainElement.appendChild(paletteDiv);
  }
}
