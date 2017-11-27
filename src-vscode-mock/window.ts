import { LspClient } from './lsp-client';
import { StatusBarAlignment, StatusBarItem } from './types';
import { TextEditor } from './text-editor'
import { Thenable } from './thenable'
import { Event } from 'vscode-jsonrpc';
import * as lsp from 'vscode-languageserver';
import { isString } from 'util';
import { MessageActionItem } from 'vscode-languageserver';

class Window {
	activeTextEditor: TextEditor | undefined;

	visibleTextEditors: TextEditor[] = []

	lspClient: LspClient
	
	createOutputChannel(name: string): OutputChannel {
		return new OutputChannel(name)
	}

	createStatusBarItem(alignment: StatusBarAlignment, priority: number) {
		return new StatusBarItem(alignment, priority)
	}

	// export function createTextEditorDecorationType
	onDidChangeActiveTextEditor: Event<TextEditor>
	// export function showErrorMessage

	showInformationMessage<T>(message: string, ...items: T[]): Thenable<T | undefined> {
		if (items) {
			const choices = items.map(item => typeof item === 'string' ? item as string : (item as any).title)
			return this.lspClient.showInformationMessage(message, ...choices).then(selection =>  {
				return items.find(item => item as any === selection || (item as any).title === selection) as T
			})
		} else {
			return this.lspClient.showInformationMessage(message).then(result => undefined)
		}
	}

	showQuickPick(items: string[] /*| Thenable<string[]>/*, options?: QuickPickOptions, token?: CancellationToken*/): Thenable<string | undefined> {
		return this.lspClient.showInformationMessage('', ...items).then(selection => {
			return items.find(item => item === selection)
		})
}
	
	// export function showInputBox
	// export function showQuickPick
	// export function showTextDocument
}

export const window = new Window()

export class OutputChannel {
	
	constructor(readonly name: string) {}

	append(value: string): void {
		// TODO: implement
	}

	appendLine(value: string): void {
		// TODO: implement
	}

	clear(): void {
		// TODO: implement
	}

	show(preserveFocus?: boolean): void{
		// TODO: implement
	}

	hide(): void{
		// TODO: implement
	}

	dispose(): void{
		// TODO: implement
	}
}
