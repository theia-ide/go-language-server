import { uriToStringUri } from './utils';
import * as lsp from 'vscode-languageserver';
import URI from 'vscode-uri'
import { Event, Emitter } from 'vscode-jsonrpc';

export class Diagnostic implements lsp.Diagnostic {
	constructor(public readonly range: lsp.Range, public readonly message: string, public readonly severity: lsp.DiagnosticSeverity) { }
}

export class DiagnosticCollection {

	store = new Map<URI, Diagnostic[]>()
	private onSetEmitter = new Emitter<lsp.PublishDiagnosticsParams>()
	onSet = this.onSetEmitter.event

	constructor(readonly name: string) {}

	clear() {
		this.store.forEach((value, uri) => {
			this.onSetEmitter.fire({
				diagnostics: [],
				uri: uriToStringUri(uri)
			})
		})
		this.store.clear()
	}

	set(uri: URI, diagnostics: Diagnostic[]) {
		this.store.set(uri, diagnostics)
		this.onSetEmitter.fire({
			diagnostics: diagnostics,
			uri: uriToStringUri(uri)
		})
	}

	get(uri: URI) {
		return this.store.get(uri)
	}
 }
