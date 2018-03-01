/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { LspClient } from './lsp-client';
import { StatusBarAlignment, StatusBarItem } from './types';
import { TextEditor } from './text-editor';
import { Thenable } from './thenable';
import { Event } from 'vscode-jsonrpc';
import * as lsp from 'vscode-languageserver';

class Window {
	activeTextEditor: TextEditor | undefined;

	visibleTextEditors: TextEditor[] = [];

	lspClient: LspClient;

	createOutputChannel(name: string): OutputChannel {
		return new OutputChannel(name);
	}

	createStatusBarItem(alignment?: StatusBarAlignment, priority?: number) {
		return new StatusBarItem(alignment, priority);
	}

	onDidChangeActiveTextEditor: Event<TextEditor>;

	showInformationMessage<T>(message: string, ...items: T[]): Thenable<T | undefined> {
		if (items) {
			const choices = items.map(item => typeof item === 'string' ? item as string : (item as any).title);
			return this.lspClient.showInformationMessage(message, ...choices).then(selection =>  {
				return items.find(item => item as any === selection || (item as any).title === selection) as T;
			});
		} else {
			return this.lspClient.showInformationMessage(message).then(result => undefined);
		}
	}

	showQuickPick(items: string[] /*| Thenable<string[]>/*, options?: QuickPickOptions, token?: CancellationToken*/): Thenable<string | undefined> {
		return this.lspClient.showInformationMessage('', ...items).then(selection => {
			return items.find(item => item === selection);
		});
	}

	showErrorMessage(message: string) {
		this.lspClient.showMessage({
			message: message,
			type: lsp.MessageType.Error
		});
	}
}

export const window = new Window();

export class OutputChannel {

	lspClient: LspClient;

	constructor(readonly name: string) {}

	append(value: string): void {
		if (this.lspClient) {
			this.lspClient.logMessage({
				message: value,
				type: lsp.MessageType.Info
			});
		}
	}

	appendLine(value: string): void {
		this.append(value);
	}

	clear(): void {
		// TODO: implement
	}

	show(preserveFocus?: boolean): void {
		// TODO: implement
	}

	hide(): void {
		// TODO: implement
	}

	dispose(): void {
		// TODO: implement
	}
}
