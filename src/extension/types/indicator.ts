export type IndicatorState =
  | "loading" // initiating script and database, script not yet launched
  | "active" // database ready and script launched
  | "dangling" // active, but the host has been removed from the configurations
  | "updating" // active, but looking for updates for (i.e. refetching) database and / or script
  | "pending-update" // active, but there are updates to the database and / or the script that requires
  // manual intervention. This usually means that the page has to be reloaded
  | "degraded" // active, but something has failed
  | "failed"; // something has failed and currently the script is not running
export class Indicator {
  #state: IndicatorState = "loading";
  #node: HTMLDivElement;
  action: () => void = () => {};
  get state() {
    return this.#state;
  }
  set state(value: IndicatorState) {
    this.#node.classList.value = `wt-indicator wt-indicator-${value}`;
    this.#state = value;
  }
  constructor(parent: HTMLElement) {
    this.#node = document.createElement("div");
    this.#node.addEventListener("click", () => {
      this.action();
    });
    parent.appendChild(this.#node);
    this.state = "loading";
  }

  static get_css() {
    return `
@keyframes wt-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes wt-color-shift {
  0% {
    border-color: #0cfc0c;
  }
  50% {
    border-color: #0cfcfc;
  }
  100% {
    border-color: #0cfc0c;
  }
}
.wt-indicator {
  width: 100%;
  height: 100%;
  border-style: solid;
  border-width: 6px;
  border-radius: 50%;
  box-sizing: border-box;
}
.wt-indicator-loading {
  border-color: #c0c0c0;
  border-top-color: #007bff;
  animation: wt-spin 1s linear infinite;
}
.wt-indicator-active {
  border-color: #0cfc0c;
}
.wt-indicator-dangling {
  border-color: #0cfc0c;
  border-style: dotted;
}
.wt-indicator-updating {
  border-color: #0cfc0c;
  border-top-color: #c0c0c0;
  animation: wt-spin 1s linear infinite;
}
.wt-indicator-pending-update {
  animation: wt-color-shift 4s ease-in-out infinite;
}
.wt-indicator-degraded {
  border-color: #acfc0c;
}
.wt-indicator-failed {
  border-color: #fc0c0c;
}`;
  }
}
