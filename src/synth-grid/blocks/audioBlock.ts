import {blockTypeMap} from "../blocks"

export class AudioBlock {
	audioCtx: AudioContext = null;
	type = "none";
	name = "unnamed";
	config: any = null;
  
	inputNode: AudioNode = null;
	outputNode:  AudioNode= null;
	hasInput = false;
	playable = false;
	constructor(audioCtx: AudioContext, config: any = {}) {
	  this.audioCtx = audioCtx;
	  this.config = config;
	  config.moduleType = Object.getPrototypeOf(this).constructor.name;
	}
	start(time: number = 0) {}
	stop(time: number = 0) {}
	createUI(element: HTMLElement, editable = true) {
	  let text = document.createElement("span");
	  text.textContent = this.type;
	  text.className = "block-overlay-type";
	  element.appendChild(text);
  
	  text = document.createElement("span");
	  text.textContent = this.name;
	  text.className = "block-overlay-name";
	  element.appendChild(text);
	}
	destroy() {
	  this.outputNode?.disconnect();
	  this.inputNode?.disconnect();
	}
	static fromConfig(audioCtx: AudioContext, config: any) {
	  return new (blockTypeMap.get(config.moduleType))(audioCtx, config);
	}
  }