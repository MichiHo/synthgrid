import { AudioBlock } from "./audioBlock";
import { pickerUI } from "../ui/pickerButtons";
import deepmerge from "deepmerge";


export class OscillatorBlock extends AudioBlock {
	playable = true;
	type = "osc";
	types = new Map<string,OscillatorType>([
	  ["saw", "sawtooth"],
	  ["sin", "sine"],
	  ["sq", "square"],
	  ["tri", "triangle"],
	]);
	currentOsc : OscillatorNode;
  
	constructor(audioCtx: AudioContext, config = {}) {
	  super(
		audioCtx,
		deepmerge(
		  {
			type: "sawtooth",
		  },
		  config
		)
	  );
	  this.outputNode = new GainNode(audioCtx);
	}
  
	createUI(element : HTMLElement, editable = true) {
	  super.createUI(element, editable);
  
	  let picker = pickerUI(
		this.types,
		this.config.type,
		(newType) => {
		  this.config.type = newType;
		  if (this.currentOsc) {
			this.currentOsc.type = newType;
		  }
		},
		editable
	  );
	  element.appendChild(picker);
	}
	start(time : number) {
	  time = time || this.audioCtx.currentTime;
	  this.stop(time);
	  this.currentOsc = new OscillatorNode(this.audioCtx);
	  this.currentOsc.type = this.config.type;
	  this.currentOsc.frequency.setValueAtTime(
		110 * 2 ** (Math.floor(Math.random() * 36) / 12),
		time
	  );
	  this.currentOsc.connect(this.outputNode);
	  this.currentOsc.start(time);
	}
  
	stop(time : number) {
	  time = time || this.audioCtx.currentTime;
  
	  if (this.currentOsc) {
		this.currentOsc.stop(time);
		this.currentOsc = null;
	  }
	}
  }