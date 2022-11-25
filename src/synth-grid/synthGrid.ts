/*
IDEAS

You can listen in on EMPTY nodes and they play a mix between next connection to the top and the right based on relative differences. Maybe even not quantized to the grid, so you can morph between sound regions!
*/

import { AudioBlock, OutputBlock } from "./blocks"

export class SynthGridSlot {
	type = "empty"
	x: number
	y: number

	audioCtx: AudioContext
	inTopSlot: SynthGridSlot
	inLeftSlot: SynthGridSlot
	outBottomSlot: SynthGridSlot
	outRightSlot: SynthGridSlot
	block: AudioBlock

	/** WebAudio node summing input blocks (if necessary) */
	inputNode: AudioNode

	get outputNode(): AudioNode {
		switch (this.type) {
			case "cross":
				return this.inputNode;
			case "block":
				if (this.block.hasInput) return this.block.outputNode;
				else return this.inputNode;
			case "right":
				return this.inLeftSlot.outputNode;
			case "down":
				return this.inTopSlot.outputNode;
		}
		return null;
	}

	name_ = ""
	get name() {
		if (this.type === "block") {
			return this.block.name
		} else if (this.type === "cross") {
			return this.name_
		} else {
			return this.type
		}
	}
	get descStr() {
		return `[${this.x},${this.y}|${this.name}]`
	}

	constructor(audioCtx: AudioContext, x: number, y: number) {
		this.audioCtx = audioCtx
		this.x = x
		this.y = y
	}

	setBlock(block: AudioBlock) {
		if (!block) throw TypeError("Block required")

		if (this.block) {
			this.block.outputNode.disconnect()
		}

		this.block = block
		this.type = "block"
		if (!this.inputNode) {
			this.inputNode = new GainNode(this.audioCtx)
		}
		if (block.hasInput) {
			this.inputNode.connect(this.block.inputNode)
		} else {
			this.block.outputNode.connect(this.inputNode)
		}
	}
	/**
	 * Disconnect this slot from it's current right output and 
	 * connect it to the input of the given slot if present.
	 * @param {SynthGridSlot} slot New right output slot. If null, or without inputNode, the output is just disconnected
	 */
	connectRight(slot: SynthGridSlot = null) {
		console.log(`connect ${this.descStr} right to ${slot?.descStr} (prev ${this.outRightSlot?.descStr}):`)
		if (this.outRightSlot) {
			// console.log(this.outRightSlot)
			this.outputNode.disconnect(this.outRightSlot.inputNode)
			this.outRightSlot = null
		}
		if (slot?.inputNode) {
			// console.log(slot)
			this.outputNode.connect(slot.inputNode)
			this.outRightSlot = slot;
		}
	}
	/**
	 * Disconnect this slot from it's current downwards output and 
	 * connect it to the input of the given slot if present.
	 * @param {SynthGridSlot} slot New downwards output slot. If null, or without inputNode, the output is just disconnected
	 */
	connectDown(slot: SynthGridSlot = null) {
		if (this.outBottomSlot) {
			this.outputNode.disconnect(this.outBottomSlot.inputNode)
			this.outBottomSlot = null
		}
		if (slot) {
			this.outputNode.connect(slot.inputNode)
			this.outBottomSlot = slot;
		}
	}
}

export class SynthGrid {
	width: number
	height: number
	audioCtx: AudioContext
	outputNode: AudioNode

	grid: SynthGridSlot[][] = []
	playableBlocks: AudioBlock[] = []
	outputBlocks: AudioBlock[] = []

	onchange: (grid: SynthGrid) => void

	blockIds = new Map<string, number>()
	crossId = 0

	constructor(width: number, height: number, audioCtx: AudioContext, outputNode: AudioNode) {
		this.width = width
		this.height = height
		this.audioCtx = audioCtx
		this.outputNode = outputNode
		this.clear()
	}

	playSound(time: number = null) {
		time = time || this.audioCtx.currentTime;
		for (let block of this.playableBlocks) {
			block.start(time)
		}
	}
	stopSound(time: number = null) {
		time = time || this.audioCtx.currentTime;
		for (let block of this.playableBlocks) {
			block.stop(time)
		}
	}

	clear() {
		this.stopSound()
		if (this.grid.length > 0) {
			for (let row of this.grid) {
				if (row.length > 0) {
					for (let slot of row) slot.block?.destroy()
				}
			}
		}
		this.grid = []
		for (let x = 0; x < this.width; x++) {
			this.grid[x] = []
			for (let y = 0; y < this.height; y++) {
				this.grid[x][y] = new SynthGridSlot(this.audioCtx, x, y)
			}
		}
		this.outputBlocks = []
		this.playableBlocks = []
		// notify observers
		this.fireOnchange()
	}

	/**
	 * 
	 * @param {int} x 
	 * @param {int} y 
	 * @param {Block} block 
	 */
	insert(x: number, y: number, block: AudioBlock) {
		if (!block) throw TypeError("insert() expects a block.")
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) throw RangeError("Coordinates must be within the size of the grid.")

		let slot = this.grid[x][y]
		if (slot.block === block) {
			console.log("Insert block which is already there " + slot.descStr)
			return;
		}

		// Handle previous block in this slot
		if (slot.block) {
			let i = this.playableBlocks.indexOf(slot.block)
			if (i >= 0) {
				slot.block.stop()
				this.playableBlocks.splice(i, 1)
			}
			i = this.outputBlocks.indexOf(slot.block)
			if (i >= 0) {
				this.outputBlocks.splice(i, 1)
			}
			slot.block.destroy()
		}

		// Register new block
		if (!this.blockIds.get(block.type)) this.blockIds.set(block.type, 1);
		block.name = `${block.type}-${this.blockIds.get(block.type)}`
		this.blockIds.set(block.type, this.blockIds.get(block.type) + 1)

		slot.setBlock(block)
		if (block.playable) {
			this.playableBlocks.push(block)
		}
		if (Object.getPrototypeOf(block) === OutputBlock.prototype) {
			this.outputBlocks.push(block)
			block.outputNode.connect(this.outputNode)
		}

		// FIND PREV NODES and route their output here
		// connect-calls should not create a second connection between same node pair
		leftSearch: if (slot.inLeftSlot) {
			slot.inLeftSlot.connectRight(slot)
		}
		upSearch: if (slot.inTopSlot) {
			slot.inTopSlot.connectDown(slot)
		}

		// EXPAND and route this output there
		this.expand(x, y)

		// notify observers
		this.fireOnchange()
	}

	/**
	 * Remove the block at the given coordinates, if present, with all resulting changes.
	 * @param {int} x Coordinate
	 * @param {int} y Coordinate
	 */
	remove(x: number, y: number) {
		let slot = this.grid[x][y];
		if (slot.type === "block") {
			if (slot.inTopSlot && slot.inLeftSlot) {
				// Simple case: turn into cross, inputs already routed into inputNode
				slot.block.outputNode.disconnect()
				if (slot.block.hasInput) {
					// Change routing from block-with-input to "regular"
					// inputNode is now outputNode, and not fed into the block any more
					slot.inputNode.disconnect(slot.block.inputNode)
					if (slot.outRightSlot)
						slot.inputNode.connect(slot.outRightSlot.inputNode)
					if (slot.outBottomSlot)
						slot.inputNode.connect(slot.outBottomSlot.inputNode)
				}
				slot.type = "cross"

			} else if (slot.inTopSlot) {
				slot.type = "down"
				// turn into down pass
				// - connect inTopSlot with outBottomSlot
				let newOutBottomSlot = null
				for (let y2 = y + 1; y2 < this.height; y2++) {
					if (this.grid[x][y2].type === "block" || this.grid[x][y2].type === "cross") {
						newOutBottomSlot = this.grid[x][y2]
						if (newOutBottomSlot) newOutBottomSlot.inTopSlot = slot.inTopSlot
						break;
					}
				}
				slot.inTopSlot.connectDown(newOutBottomSlot)

				// - remove right connection (propagates)
				this.eraseRight(x, y)

			} else if (slot.inLeftSlot) {
				slot.type = "right"
				// turn into left pass
				// - re-route inLeftSlot to outRightSlot
				let newOutRightSlot = null
				for (let x2 = x + 1; x2 < this.width; x2++) {
					if (this.grid[x2][y].type === "block" || this.grid[x2][y].type === "cross")
						newOutRightSlot = this.grid[x2][y]
					if (newOutRightSlot) newOutRightSlot.inLeftSlot = slot.inLeftSlot
				}
				slot.inLeftSlot.connectDown(newOutRightSlot)

				// - remove down connection (propagates)
				this.eraseDown(x, y)

			} else {
				slot.type = "empty"
				// turn into empty slot
				// - remove both connections (propagates)
				this.eraseRight(x, y)
				this.eraseDown(x, y)
			}
			slot.block = null
		} else console.log(`Can't remove anything in slot of type ${slot.type}`)

		// notify observers
		this.fireOnchange()
	}

	/**
	 * Expand the cross or block at the given location, creating new right/down/cross slots as necessary
	 * and recursively expanding the new cross slots.
	 * 
	 * @param {int} x 
	 * @param {int} y 
	 */
	expand(x: number, y: number) {
		let slot = this.grid[x][y];

		if (slot.type !== "cross" && slot.type !== "block") throw TypeError("Can only expand block and cross type slots");
		// from slot go right until otherSlot is cross or block to connect to
		rightExpand: for (let x2 = x + 1; x2 < this.width; x2++) {
			// new connections to the right
			let otherSlot = this.grid[x2][y]
			otherSlot.inLeftSlot = slot
			switch (otherSlot.type) {
				case "empty":
					otherSlot.type = "right"
					break;
				case "down":
					// Create new cross and expand it further
					otherSlot.type = "cross"
					otherSlot.name_ = `cross-${this.crossId++}`
					otherSlot.inputNode = new GainNode(this.audioCtx)
					slot.connectRight(otherSlot)
					otherSlot.inTopSlot.connectDown(otherSlot)
					this.expand(x2, y)
					break rightExpand;
				case "cross":
					slot.connectRight(otherSlot)
					break rightExpand;
				case "block":
					// Blocks already were expanded on creation
					slot.connectRight(otherSlot)
					break rightExpand;
				// case right does not require any action
			}
		}
		downExpand: for (let y2 = y + 1; y2 < this.height; y2++) {
			// new connections to the bottom
			let otherSlot = this.grid[x][y2]
			otherSlot.inTopSlot = slot
			switch (otherSlot.type) {
				case "empty":
					otherSlot.type = "down"
					break;
				case "right":
					// Create new cross and expand it further
					otherSlot.type = "cross"
					otherSlot.name_ = `cross-${this.crossId++}`
					otherSlot.inputNode = new GainNode(this.audioCtx)
					slot.connectDown(otherSlot)
					otherSlot.inLeftSlot.connectRight(otherSlot)
					this.expand(x, y2)
					break downExpand;
				case "cross":
					slot.connectDown(otherSlot)

					break downExpand;
				case "block":
					// Blocks already were expanded on creation
					slot.connectDown(otherSlot)
					break downExpand;
				// case down does not require any action
			}
		}
	}



	/**
	 * Propagate a removed connection rightwards from (x,y)
	 * 
	 * @param {int} x 
	 * @param {int} y 
	 */
	eraseRight(x: number, y: number) {
		for (let x2 = x + 1; x2 < this.width; x2++) {
			let otherSlot = this.grid[x2][y]
			otherSlot.inLeftSlot = null
			switch (otherSlot.type) {
				case "empty":
				case "down":
					console.log(otherSlot.type + " in eraseRight, this should not happen?")
					return;
				case "right":
					otherSlot.type = "empty"
					otherSlot.inputNode = null
					break;
				case "block":
					// nothing?
					return;
				case "cross":
					// turn into down, propagate "nothingness" further
					otherSlot.type = "down"
					this.eraseRight(x2, y)
					// connect downwards connections to next active slot above
					remapDown: for (let y2 = y + 1; y2 < this.height; y2++) {
						let otherOtherSlot = this.grid[x2][y2]
						otherOtherSlot.inTopSlot = otherSlot.inTopSlot
						if (otherOtherSlot.type !== "down") break remapDown;
					}
					return;
			}
		}
	}

	/**
	 * Propagate a removed connection downwards from (x,y)
	 * 
	 * @param {int} x 
	 * @param {int} y 
	 */
	eraseDown(x: number, y: number) {
		for (let y2 = y + 1; y2 < this.height; y2++) {
			let otherSlot = this.grid[x][y2]
			otherSlot.inTopSlot = null
			switch (otherSlot.type) {
				case "empty":
				case "right":
					console.log(otherSlot.type + " in eraseDown, this should not happen?")
					return;
				case "down":
					otherSlot.type = "empty"
					otherSlot.inputNode = null
					break;
				case "block":
					// nothing?
					return;
				case "cross":
					// turn into right, propagate "nothingness" further
					otherSlot.type = "right"
					this.eraseDown(x, y2)
					// connect rightwards connections to next active slot left
					remapRight: for (let x2 = x + 1; x2 < this.width; x2++) {
						let otherOtherSlot = this.grid[x2][y2]
						otherOtherSlot.inLeftSlot = otherSlot.inLeftSlot
						if (otherOtherSlot.type !== "right") break remapRight;
					}
					return;
			}
		}
	}

	#changeTimeout = 0
	fireOnchange() {
		if (this.onchange == null) return;

		window.clearTimeout(this.#changeTimeout);
		this.#changeTimeout = window.setTimeout(() => this.onchange(this), 1);
	}
}