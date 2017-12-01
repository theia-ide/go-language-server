import { window } from "./window";

export default class TelemetryReporter {
	constructor(...any: any[]) {
	}

	sendTelemetryEvent(...any: any[]) {
		window.lspClient.sendTelemetryEvent(any)
	}
}