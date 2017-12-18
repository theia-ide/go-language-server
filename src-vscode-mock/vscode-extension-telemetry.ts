import { window } from './window';

export default class TelemetryReporter {
	constructor(...args: any[]) {
	}

	sendTelemetryEvent(...args: any[]) {
		window.lspClient.sendTelemetryEvent(args);
	}
}