import deepmerge from "deepmerge";
import { GainBlock } from "./gainBlock";

export class InputBlock extends GainBlock {
	type = "input";
	playable = true;
	connected = false;


	static streamSource: MediaStreamAudioSourceNode
	static async getStreamSource(audioCtx: AudioContext): Promise<MediaStreamAudioSourceNode> {
		if (!InputBlock.streamSource) {
			let stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			InputBlock.streamSource = audioCtx.createMediaStreamSource(stream)
		}
		return InputBlock.streamSource
	}

	constructor(audioCtx: AudioContext, config = {}) {
		super(audioCtx, deepmerge({ gain: 1.0 }, config));
		this.hasInput = false
	}


	start(time: number = 0) {
		InputBlock.getStreamSource(this.audioCtx).then(streamSource => {
			streamSource.connect(this.outputNode)
			this.connected = true
		})
	}
	stop(time: number = 0) {
		if (this.connected) {
			InputBlock.getStreamSource(this.audioCtx).then(streamSource => {
				streamSource.disconnect(this.outputNode)
			})
		}
	}
}