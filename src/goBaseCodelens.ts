
import * as vscode from '../src-vscode-mock/vscode';

export abstract class GoBaseCodeLensProvider implements vscode.CodeLensProvider {
	protected enabled: boolean = true;
	private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();


	public get onDidChangeCodeLenses(): vscode.Event<void> {
		return this.onDidChangeCodeLensesEmitter.event;
	}

	public setEnabled(enabled: false): void {
		if (this.enabled !== enabled) {
			this.enabled = enabled;
			// [TypeFox]
			//this.onDidChangeCodeLensesEmitter.fire();
			this.onDidChangeCodeLensesEmitter.fire(undefined);
		}
	}

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
		return [];
	}

}