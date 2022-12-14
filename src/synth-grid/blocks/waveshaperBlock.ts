import { AudioBlock } from "./audioBlock";
import { BoxSlider } from "../ui/boxSlider";
import deepmerge from "deepmerge";

export class WaveshaperBlock extends AudioBlock {
  hasInput = true;
  type = "waveshaper";
  waveshaperNode: WaveShaperNode;

  constructor(audioCtx: AudioContext, config = {}) {
    super(audioCtx, deepmerge({  }, config));
    this.waveshaperNode = new WaveShaperNode(this.audioCtx);
    this.waveshaperNode.curve = this.makeDistortionCurve(400)
    this.waveshaperNode.oversample = "2x"
    this.inputNode = this.waveshaperNode;
    this.outputNode = this.inputNode;
  }
  
  /**
   * Taken from https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createWaveShaper#example
   * @param amount Dont know yet
   * @returns A curve for the WaveshaperNode
   */
makeDistortionCurve(amount = 50) {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; i++) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

  // createUI(element: HTMLElement, editable = true) {
  //   super.createUI(element, editable);
  //   let sliderElement = document.createElement("div");
  //   element.appendChild(sliderElement);

  //   let timeSlider = new BoxSlider(sliderElement, {
  //     format: (v: number) => `${v.toFixed(2)}s`,
  //     startVal: this.waveshaperNode.delayTime.value,
  //     minVal: 0.0,
  //     maxVal: 2.0,
  //     editable: editable,
  //     title: "time",
  //   });
  //   if (editable) {
  //     timeSlider.onslide = (val) => {
  //       this.waveshaperNode.delayTime.value = val;
  //     };
  //   }
  // }
}
