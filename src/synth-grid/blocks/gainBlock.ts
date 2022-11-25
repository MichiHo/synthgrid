import { AudioBlock } from "./audioBlock";
import { BoxSlider } from "../ui/boxSlider";
import { dbToLin, linToDb } from "../utils";
import deepmerge from "deepmerge";

export class GainBlock extends AudioBlock {
  hasInput = true;
  type = "gain";
  gainNode: GainNode;

  constructor(audioCtx: AudioContext, config = {}) {
    super(audioCtx, deepmerge({ gain: 1.0 }, config));
    this.gainNode = new GainNode(this.audioCtx);
    this.inputNode = this.gainNode;
    this.gainNode.gain.value = this.config.gain;
    this.outputNode = this.inputNode;
  }

  createUI(element: HTMLElement, editable = true) {
    super.createUI(element, editable);
    let sliderElement = document.createElement("div");
    element.appendChild(sliderElement);

    let gainSlider = new BoxSlider(sliderElement, {
      format: (v: number) => `${v.toFixed(1)}`,
      startVal: linToDb(this.gainNode.gain.value),
      minVal: -30.0,
      maxVal: 0.0,
      editable: editable,
      title: "gain",
    });
    if (editable) {
      gainSlider.onslide = (val) => {
        this.gainNode.gain.value = dbToLin(val);
      };
    }
  }
}
