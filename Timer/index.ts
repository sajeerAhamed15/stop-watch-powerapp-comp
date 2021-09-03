import {IInputs, IOutputs} from "./generated/ManifestTypes";

export class Timer implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private _value: number;
	private _laps: number[];
	private _context: ComponentFramework.Context<IInputs>;
	private _notifyOutputChanged: () => void;

	private _triggerTimer: EventListenerOrEventListenerObject;
	private _triggerReset: EventListenerOrEventListenerObject;
	private _triggerLap: EventListenerOrEventListenerObject;

	private _started: boolean;
	private _timeoutInterval: NodeJS.Timeout;
	
	private _timerValue: HTMLLabelElement;
	private _lapValues: HTMLLabelElement;
	private _startButton: HTMLButtonElement;
	private _resetButton: HTMLButtonElement;
	private _lapButton: HTMLButtonElement;
	private _container: HTMLDivElement;
	
	constructor()
	{
		
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void
	{
		this._context = context;
		this._notifyOutputChanged = notifyOutputChanged;
		this._triggerTimer = this.triggerTimer.bind(this);
		this._triggerReset = this.resetTimer.bind(this);
		this._triggerLap = this.breakLap.bind(this)

		this._started = false;
		this._laps = []
		this._value = context.parameters.currentTime.raw!;

		this._container = document.createElement("div");
		this._container.style.display = "grid"
		this._container.style.width = "100px"

		const label = document.createElement("label");
		label.innerHTML = "Stop Watch";

		this._timerValue = document.createElement("label");

		this._lapValues = document.createElement("label");

		this._startButton = document.createElement("button");
		this._startButton.innerHTML = "Start"
		this._startButton.onclick = this._triggerTimer

		this._resetButton = document.createElement("button")
		this._resetButton.innerHTML = "Reset"
		this._resetButton.onclick = this._triggerReset

		this._lapButton = document.createElement("button")
		this._lapButton.innerHTML = "Lap"
		this._lapButton.onclick = this._triggerLap
		
		this._container.appendChild(label);
		this._container.appendChild(this._timerValue);
		this._container.appendChild(this._startButton)
		this._container.appendChild(this._resetButton)
		this._container.appendChild(this._lapButton)
		this._container.appendChild(this._lapValues)
		container.appendChild(this._container);
	}

	/**
	 * Called when Lap button is clicked
	 */
	public breakLap(evt: Event): void {
		this._laps.push(this._value)
		this._lapValues.innerHTML = this._laps.map((value, i) => {
			return `${i + 1}. ${this.splitSeconds(value)}`
		}).join("<br>")
	}

	/**
	 * Called when Reset button is clicked
	 */
	public resetTimer(evt: Event): void {
		this._started = true
		this._value = 0
		this._laps = []
		this._lapValues.innerHTML = ""
		this._startButton.click()
	}
	
	/**
	 * Util function to split seconds to HH:mm:ss format
	 */
	public splitSeconds(sec: number): string {
		let hours   = Math.floor(sec / 3600);
		let minutes = Math.floor((sec - (hours * 3600)) / 60);
		let seconds = sec - (hours * 3600) - (minutes * 60)
		return (hours < 10 ? `0${hours}` : hours) + ':' + (minutes < 10 ? `0${minutes}` : minutes) + ":" + (seconds < 10 ? `0${seconds}` : seconds)
	}

	/**
	 * Called when Start/Stop button is clicked
	 */
	public triggerTimer(evt: Event): void {
		if (!this._started) {
			this._timeoutInterval = setInterval(() => {
				this._value = this._value + 1
				this._timerValue.innerHTML = this.splitSeconds(this._value)
			}, 1000);
		} else {
			clearInterval(this._timeoutInterval)
		}
		this._startButton.innerHTML = this._started ? "Start" : "Stop"
		this._started = !this._started
		this._notifyOutputChanged();
	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		this._value = context.parameters.currentTime.raw!;
		this._context = context;
		this._timerValue.innerHTML = this.splitSeconds(parseInt(this._context.parameters.currentTime.formatted || "0"));
	}

	/**
	 * It is called by the framework prior to a control receiving new data.
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {
			currentTime: this._value
		};
	}

	/**
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		clearInterval(this._timeoutInterval)
	}
}
