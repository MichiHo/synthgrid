import { AudioBlock } from "./audioBlock";
import { pickerUI } from "../ui/pickerButtons";
import { BoxSlider } from "../ui/boxSlider";
import { smallHzFormat } from "../utils";
import deepmerge from "deepmerge";

export class FilterBlock extends AudioBlock {
	hasInput = true;
	type = "filter";
	filterNode : BiquadFilterNode;
  
	static types = new Map<string,BiquadFilterType>([
	  ["hp", "highpass"],
	  ["lp", "lowpass"],
	  ["bp", "bandpass"],
	]);
  
	constructor(audioCtx: AudioContext, config = {}) {
	  super(audioCtx, deepmerge({ cutoff: 1000.0, type: "lowpass" }, config));
  
	  this.filterNode = new BiquadFilterNode(this.audioCtx);
	  this.filterNode.frequency.value = this.config.cutoff;
	  this.filterNode.type = this.config.type;
	  
	  this.inputNode = this.filterNode;
	  this.outputNode = this.filterNode;
	}
  
	createUI(element : HTMLElement, editable = true) {
	  super.createUI(element, editable);
	  let sliderElement = document.createElement("div");
	  element.appendChild(sliderElement);
  
	  let cutoffSlider = new BoxSlider(sliderElement, {
		format: (v : number) => smallHzFormat(10 ** v),
		startVal: Math.log10(this.config.cutoff),
		minVal: Math.log10(10),
		maxVal: Math.log10(20000),
		editable: editable,
		title: "freq",
	  });
  
	  if (editable) {
		cutoffSlider.onslide = (val) => {
		  this.filterNode.frequency.value = this.config.cutoff = 10 ** val;
		};
	  }
  
	  let picker = pickerUI(
		FilterBlock.types,
		this.config.type,
		(type) => { 
		  
		  this.filterNode.type = type;
		  this.config.type = type;
		},
		editable
	  );
	  element.appendChild(picker);
	}
  }