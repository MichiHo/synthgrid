import {AudioBlock} from "./blocks/audioBlock"
export {AudioBlock} from "./blocks/audioBlock"

import { ReverbBlock } from "./blocks/reverbBlock";
export { ReverbBlock } from "./blocks/reverbBlock";

import { OscillatorBlock } from "./blocks/oscillatorBlock";
export { OscillatorBlock } from "./blocks/oscillatorBlock";

import { FilterBlock } from "./blocks/filterBlock";
export { FilterBlock } from "./blocks/filterBlock";

import { GainBlock } from "./blocks/gainBlock";
export { GainBlock } from "./blocks/gainBlock";

import { OutputBlock } from "./blocks/outputBlock";
export { OutputBlock } from "./blocks/outputBlock";

import { InputBlock } from "./blocks/inputBlock";
import { CompressorBlock } from "./blocks/compressorBlock";
import { DelayBlock } from "./blocks/delayBlock";
import { WaveshaperBlock } from "./blocks/waveshaperBlock";
export { InputBlock } from "./blocks/inputBlock";

export const blockTypes = [
  OscillatorBlock,
  InputBlock,
  GainBlock,
  CompressorBlock,
  FilterBlock,
  DelayBlock,
  WaveshaperBlock,
  ReverbBlock,
  OutputBlock,
];
export const blockTypeMap = new Map<string, typeof AudioBlock>();
for (let t of blockTypes) {
  blockTypeMap.set(t.name, t);
}
