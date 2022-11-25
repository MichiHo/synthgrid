import deepmerge from "deepmerge";
import { GainBlock } from "./gainBlock";

export class OutputBlock extends GainBlock {
	type = "output";
	constructor(audioCtx: AudioContext, config = {}) {
	  super(audioCtx, deepmerge({ gain: 1.0 }, config));
	}
  }