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


export const blockTypes = [
  GainBlock,
  OutputBlock,
  OscillatorBlock,
  ReverbBlock,
  FilterBlock,
];
export const blockTypeMap = new Map<string, typeof AudioBlock>();
for (let t of blockTypes) {
  blockTypeMap.set(t.name, t);
}
