import { AudioBlock } from "./audioBlock";
import { BoxSlider } from "../ui/boxSlider";
import deepmerge from "deepmerge";

export class DelayBlock extends AudioBlock {
  hasInput = true;
  type = "delay";
  delayNode: DelayNode;

  constructor(audioCtx: AudioContext, config = {}) {
    super(audioCtx, deepmerge({ time: 0.0 }, config));
    this.delayNode = new DelayNode(this.audioCtx);
    this.delayNode.delayTime.value = this.config.time;
    this.inputNode = this.delayNode;
    this.outputNode = this.inputNode;
  }

  createUI(element: HTMLElement, editable = true) {
    super.createUI(element, editable);
    let sliderElement = document.createElement("div");
    element.appendChild(sliderElement);

    let timeSlider = new BoxSlider(sliderElement, {
      format: (v: number) => `${v.toFixed(2)}s`,
      startVal: this.delayNode.delayTime.value,
      minVal: 0.0,
      maxVal: 2.0,
      editable: editable,
      title: "time",
    });
    if (editable) {
      timeSlider.onslide = (val) => {
        this.delayNode.delayTime.value = val;
      };
    }
  }
}
