import { AudioBlock } from "./audioBlock";
import { BoxSlider } from "../ui/boxSlider";
import { dbToLin, linToDb } from "../utils";
import deepmerge from "deepmerge";

export class CompressorBlock extends AudioBlock {
  hasInput = true;
  type = "comp";
  compressorNode: DynamicsCompressorNode;

  constructor(audioCtx: AudioContext, config = {}) {
    super(audioCtx, deepmerge({ thres: -30.0, ratio : 12}, config));
    this.compressorNode = new DynamicsCompressorNode(this.audioCtx);
    this.compressorNode.threshold.value = this.config.thres;
    this.compressorNode.ratio.value = this.config.ratio;
    this.inputNode = this.compressorNode;
    this.outputNode = this.inputNode;
  }

  createUI(element: HTMLElement, editable = true) {
    super.createUI(element, editable);
    let thresSliderElement = document.createElement("div");
    element.appendChild(thresSliderElement);

    let thresSlider = new BoxSlider(thresSliderElement, {
		format: (v: number) => `${v.toFixed(1)}`,
		startVal: linToDb(this.compressorNode.threshold.value),
		minVal: -30.0,
		maxVal: 0.0,
		editable: editable,
		title: "thres",
	  });
	  if (editable) {
		thresSlider.onslide = (val) => {
		  this.compressorNode.threshold.value = dbToLin(val);
		};
	  }

    let ratioSliderElement = document.createElement("div");
    element.appendChild(ratioSliderElement);

    let ratioSlider = new BoxSlider(ratioSliderElement, {
      format: (v: number) => `${v.toFixed(1)}`,
      startVal: this.compressorNode.ratio.value,
      minVal: 1.0,
      maxVal: 20.0,
      editable: editable,
      title: "ratio",
    });
    if (editable) {
		ratioSlider.onslide = (val) => {
        this.compressorNode.ratio.value = val;
      };
    }
  }
}
