import deepmerge from "deepmerge";
import { AudioBlock } from "./audioBlock";
import { BoxSlider } from "../ui/boxSlider";
import { pickerUI } from "../ui/pickerButtons";
import { clamp } from "../utils";

export class ReverbBlock extends AudioBlock {
	hasInput = true;
	type = "reverb";

	static loadedImpulseResponses = new Map<string, AudioBuffer>();
	static impulseResponseFiles = new Map([
		["Light", "LittlefieldLobby.wav"],
		["Dark", "3000CStreetGarageStairwell.wav"],
		["Weird", "TunnelToHell.wav"],
		["Short", "MillsGreekTheater.wav"],
	]);

	convolver: ConvolverNode;
	wet_gain: GainNode;
	dry_gain: GainNode;

	constructor(audioCtx: AudioContext, config = {}) {
		super(
			audioCtx,
			deepmerge(
				{
					room: "Light",
					wetAmount: 0.8,
				},
				config
			)
		);

		this.inputNode = new GainNode(audioCtx);
		this.outputNode = new GainNode(audioCtx);
		this.convolver = new ConvolverNode(audioCtx);
		this.wet_gain = new GainNode(audioCtx);
		this.dry_gain = new GainNode(audioCtx);

		this.inputNode.connect(this.dry_gain);
		this.inputNode.connect(this.convolver);
		this.convolver.connect(this.wet_gain);
		this.wet_gain.connect(this.outputNode);
		this.dry_gain.connect(this.outputNode);

		this.switchImpulseResponse(this.config.room);
		this.setWetAmount(this.config.wetAmount);
	}

	createUI(element: HTMLElement, editable = true) {
		super.createUI(element, editable);
		let sliderElement = document.createElement("div");
		element.appendChild(sliderElement);

		let wetSlider = new BoxSlider(sliderElement, {
			format: (v: number) => `${(v * 100).toFixed(0)}%`,
			startVal: this.config.wetAmount,
			minVal: 0,
			maxVal: 1.0,
			editable: editable,
			title: "amount",
			minLabel: "dry",
			maxLabel: "wet",
		});
		if (editable) {
			wetSlider.onslide = (val) => {
				this.setWetAmount(val);
			};
		}
		let picker = pickerUI(
			ReverbBlock.impulseResponseFiles.keys(),
			this.config.room,
			(newRoom) => this.switchImpulseResponse(newRoom),
			editable
		);

		element.appendChild(picker);
	}

	/** Switch to the named IR, or bypass if name not known */
	async switchImpulseResponse(name: string) {
		if (ReverbBlock.impulseResponseFiles.has(name)) {
			let filename = ReverbBlock.impulseResponseFiles.get(name);
			if (!(ReverbBlock.loadedImpulseResponses.has(name))) {
				// Load IR
				try {
					let response = await fetch(`./assets/impulse_responses/${filename}`);
					let arraybuffer = await response.arrayBuffer();
					ReverbBlock.loadedImpulseResponses.set(name, await this.audioCtx.decodeAudioData(arraybuffer));
				} catch (err) {
					console.log(`Could not load Impulse Response ${name}`);
					console.error(err);
					ReverbBlock.loadedImpulseResponses.delete(name);
					this.bypass();
					return;
				}
			}
			this.setWetAmount(this.config.wetAmount);
			this.convolver.buffer = ReverbBlock.loadedImpulseResponses.get(name);
			this.config.room = name;
		} else {
			this.bypass();
		}
	}

	/** Set amount of wet signal. At 1.0 only reverb and 0.0 only input. */
	setWetAmount(amt: number, time = 0) {
		time = time || this.audioCtx.currentTime;
		amt = clamp(amt, 0.0, 1.0);
		this.wet_gain.gain.linearRampToValueAtTime(amt, time + 0.001);
		this.dry_gain.gain.linearRampToValueAtTime(1.0 - amt, time + 0.001);
		this.config.wetAmount = amt;
	}

	bypass() {
		this.wet_gain.gain.linearRampToValueAtTime(
			0.0,
			this.audioCtx.currentTime + 0.001
		);
		this.config.room = "";
	}
}