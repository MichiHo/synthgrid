import * as utils from "../utils";
import deepmerge from "deepmerge";

export class BoxSlider {
  #value: number;
  config: any;

  wrapper: HTMLElement;
  domElement: HTMLElement;
  sliderElement: HTMLElement;
  valueElement: HTMLElement;

  sliding = false
  mouseover = false

  get value() {
    return this.#value;
  }
  set value(v) {
    this.#value = utils.clamp(v, this.config.minVal, this.config.maxVal);
    let percent =
      ((this.#value - this.config.minVal) /
        (this.config.maxVal - this.config.minVal)) *
      100;
    this.sliderElement.style.height = `${percent}%`;
    this.valueElement.textContent = this.formatted();
  }

  onslide = (val : number) => {};
  oncommit = (val : number) => {};

  constructor(element : HTMLElement, config : any= {}) {
    this.config = deepmerge(
      {
        minVal: 0,
        maxVal: 1,
        startVal: undefined,
        format: undefined,
        minLabel: undefined,
        maxLabel: undefined,
        editable: true,
        size: "30px",
        title: null,
      },
      config
    );
    if (this.config.size instanceof Number)
      this.config.size = `${this.config.size}px`;

    this.wrapper = element;
    this.wrapper.classList.add("box-slider-wrapper");
    this.domElement = document.createElement("div");
    this.wrapper.appendChild(this.domElement);
    this.domElement.classList.add("box-slider");
    this.domElement.style.height = this.config.size;
    this.domElement.style.width = this.config.size;

    if (this.config.title) {
      let title = document.createElement("span");
      title.className = "box-slider-title";
      title.textContent = this.config.title;
      this.wrapper.appendChild(title);
    }

    ///////////////////////////////////////////////////////////////////////
    // MOUSE EVENTS

    let this_ = this;
    this.domElement.addEventListener("mouseenter", () => {
      this_.reveal();
      this_.mouseover = true;
    });
    this.domElement.addEventListener("mouseleave", () => {
      if (!this_.sliding) this_.hide();
      this_.mouseover = false;
    });
    if (this.config.editable) {
      let mousemove = function (ev : MouseEvent) {
        if (this_.sliding) {
          this_.mouseEvent(ev);
        }
      };
      let mouseup = function (ev : MouseEvent) {
        if (!this_.mouseover) this_.hide();
        this_.sliding = false;
        this_.domElement.classList.remove("box-slider-sliding");
        document.removeEventListener("mouseup", mouseup);
        document.removeEventListener("mousemove", mousemove);
        this_.mouseEvent(ev);
        this_.oncommit(this_.value);
      };
      this.domElement.addEventListener("mousedown", (ev) => {
        this_.reveal();
        this_.sliding = true;
        this_.domElement.classList.add("box-slider-sliding");
        document.addEventListener("mousemove", mousemove);
        document.addEventListener("mouseup", mouseup);
        this_.mouseEvent(ev);
      });
    }

    ///////////////////////////////////////////////////////////////////////
    // UI SETUP

    this.sliderElement = document.createElement("div");
    this.sliderElement.className = "box-slider-slider";
    this.domElement.appendChild(this.sliderElement);

    this.valueElement = document.createElement("span");
    this.valueElement.className = "box-slider-value box-slider-hidden";
    this.domElement.appendChild(this.valueElement);

    let minLabel = document.createElement("span");
    minLabel.className = "box-slider-min-label box-slider-hidden";
    minLabel.textContent =
      this.config.minLabel || this.formatted(this.config.minVal);
    this.domElement.appendChild(minLabel);

    let maxLabel = document.createElement("span");
    maxLabel.className = "box-slider-max-label box-slider-hidden";
    maxLabel.textContent =
      this.config.maxLabel || this.formatted(this.config.maxVal);
    this.domElement.appendChild(maxLabel);

    if (this.config.startVal !== undefined) this.value = this.config.startVal;
    else this.value = this.config.minVal;
  }

  reveal() {
    this.wrapper.classList.add("box-slider-revealed");
  }
  hide() {
    this.wrapper.classList.remove("box-slider-revealed");
  }
  mouseEvent(ev : MouseEvent) {
    //ev.shiftKey
    let { top, bottom } = this.domElement.getBoundingClientRect();
    this.value =
      this.config.minVal +
      ((this.config.maxVal - this.config.minVal) * (bottom - ev.clientY)) /
        (bottom - top);
    this.onslide(this.value);
  }
  formatted(val : number = null) {
    if (val === null) val = this.value;

    if (this.config.format) return this.config.format(val);
    else return "" + val;
  }
}
