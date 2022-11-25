
/**
 * Create a picker to choose from a given set of items.
 *
 * @param {string[] | Object} choices If Array, the strings are used and passed to onchange, if not, the keys of enumerable properties are displayed and the values are passed to onchange
 * @param {string} initial Initial choice. If not an Array this addresses the value of a param
 * @param {(choice:string) => void} onchange Called on selection with the new choice as only argument
 * @param {boolean} editable If false, the value can not be changed
 * @returns DOM Element to append to something
 */
 export function pickerUI<T extends string>(
	choices : Map<string,T> | Iterable<string>,
	initial: T,
	onchange: (choice: T) => void,
	editable = true
  ) {
	let buttons = new Map<string, HTMLElement>();
	let changedType = (choice: T) => {
	  let prevSelect = picker.querySelector(".selected");
	  if (prevSelect) prevSelect.classList.remove("selected");
	  if (buttons.has(choice)) {
		buttons.get(choice).classList.add("selected");
	  } else console.log(`Missing type in buttons: ${choice}`);
	};
	let picker = document.createElement("div");
	picker.className = "option-picker";
	let button = document.createElement("button");
	//let choices_ = choices instanceof Array ? choices : choices.entries();
	for (let option of choices) {
	  button = document.createElement("button");
	  let text = typeof option === "string" ? option : option[0] as string;
	  let value = (typeof option === "string" ? option : option[1]) as T;
	  button.textContent = text;
	  button.title = value;
	  buttons.set(value, button);
	  if (editable) {
		button.onclick = () => {
		  onchange(value);
		  changedType(value);
		};
	  }
	  picker.appendChild(button);
	}
	changedType(initial);
	return picker;
  }
  