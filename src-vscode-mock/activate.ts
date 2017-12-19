/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { outputChannel } from '../src/goStatus';
import { installCurrentPackage } from '../src/goInstall';
import { commands } from './commands';
import { addImport } from '../src/goImport';
import { LspClient } from './lsp-client';
import { LspServer } from './lsp-server';
import { errorDiagnosticCollection, warningDiagnosticCollection } from '../src/goMain';
import { window } from './window';
import { Logger } from './logger';
import { lintCode } from '../src/goLint';
import { vetCode } from '../src/goVet';
import * as goGenerateTests from '../src/goGenerateTests';
import { goGetPackage } from '../src/goGetPackage';
import { addTags, removeTags } from '../src/goModifytags';
import { playgroundCommand } from '../src/goPlayground';
import { CommandConfig } from './config';
import { buildCode } from '../src/goBuild';
import { MessageType, workspace } from './vscode';
import { updateGoPathGoRootFromConfig, offerToInstallTools } from '../src/goInstallTools';
import { getCurrentGoPath } from '../src/util';

let _activated: () => void;

export const activated = new Promise<void>((resolve, reject) => {
	_activated = resolve;
});

export function activate(lspClient: LspClient, lspServer: LspServer, logger: Logger) {
	outputChannel.lspClient = lspClient;
	window.lspClient = lspClient;

	console.log = logger.log.bind(logger);
	console.error = logger.error.bind(logger);
	console.warn = logger.warn.bind(logger);
	console.info = logger.info.bind(logger);

	updateGoPathGoRootFromConfig();
	// .then(() => {
	// 	const updateToolsCmdText = 'Update tools';
	// 	const prevGoroot = ctx.globalState.get('goroot');
	// 	const currentGoroot = process.env['GOROOT'];
	// 	if (prevGoroot !== currentGoroot && prevGoroot) {
	// 		vscode.window.showInformationMessage('Your goroot is different than before, few Go tools may need re-compiling', updateToolsCmdText).then(selected => {
	// 			if (selected === updateToolsCmdText) {
	// 				vscode.commands.executeCommand('go.tools.install');
	// 			}
	// 		});
	// 	} else {
	// 		getGoVersion().then(currentVersion => {
	// 			if (currentVersion) {
	// 				const prevVersion = ctx.globalState.get('goVersion');
	// 				const currVersionString = `${currentVersion.major}.${currentVersion.minor}`;

	// 				if (prevVersion !== currVersionString) {
	// 					if (prevVersion) {
	// 						vscode.window.showInformationMessage('Your Go version is different than before, few Go tools may need re-compiling', updateToolsCmdText).then(selected => {
	// 							if (selected === updateToolsCmdText) {
	// 								vscode.commands.executeCommand('go.tools.install');
	// 							}
	// 						});
	// 					}
	// 					ctx.globalState.update('goVersion', currVersionString);
	// 				}
	// 			}
	// 		});
	// 	}
	// 	ctx.globalState.update('goroot', currentGoroot);
	offerToInstallTools();

	// ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
	// 	let updatedGoConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
	// 	sendTelemetryEventForConfig(updatedGoConfig);
	// 	updateGoPathGoRootFromConfig();

	// 	// If there was a change in "useLanguageServer" setting, then ask the user to reload VS Code.
	// 	if (process.platform !== 'win32'
	// 		&& didLangServerConfigChange(useLangServer, langServerFlags, updatedGoConfig)
	// 		&& (!updatedGoConfig['useLanguageServer'] || checkLanguageServer())) {
	// 		vscode.window.showInformationMessage('Reload VS Code window for the change in usage of language server to take effect', 'Reload').then(selected => {
	// 			if (selected === 'Reload') {
	// 				vscode.commands.executeCommand('workbench.action.reloadWindow');
	// 			}
	// 		});
	// 	}
	// 	useLangServer = updatedGoConfig['useLanguageServer'];

	// 	// If there was a change in "toolsGopath" setting, then clear cache for go tools
	// 	if (getToolsGopath() !== getToolsGopath(false)) {
	// 		clearCacheForTools();
	// 	}

	// 	if (updatedGoConfig['enableCodeLens']) {
	// 		testCodeLensProvider.setEnabled(updatedGoConfig['enableCodeLens']['runtest']);
	// 		referencesCodeLensProvider.setEnabled(updatedGoConfig['enableCodeLens']['references']);
	// 	}

	// }));

	errorDiagnosticCollection.onSet(lspClient.publishDiagnostics.bind(lspClient));
	warningDiagnosticCollection.onSet(lspClient.publishDiagnostics.bind(lspClient));

	commands.lspClient = lspClient;

	commands.registerCommand('go.gopath', () => {
		let gopath = getCurrentGoPath();

		let wasInfered = workspace.getConfiguration('go', window.activeTextEditor ? window.activeTextEditor.document.uri : null)['inferGopath'];
		let root = workspace.rootPath;
		if (window.activeTextEditor && workspace.getWorkspaceFolder(window.activeTextEditor.document.uri)) {
			root = workspace.getWorkspaceFolder(window.activeTextEditor.document.uri).uri.fsPath;
		}

		// not only if it was configured, but if it was successful.
		if (wasInfered && root && root.indexOf(gopath) === 0) {
			const inferredFrom = window.activeTextEditor ? 'current folder' : 'workspace root';
			window.showInformationMessage(`Current GOPATH is inferred from ${inferredFrom}: ${gopath}`);
		} else {
			window.showInformationMessage('Current GOPATH: ' + gopath);
		}
	});

	commands.registerCommand('go.import.add', (arg: string) => {
		return addImport(typeof arg === 'string' ? arg : null);
	});

	commands.registerCommand('go.install.package', installCurrentPackage);

	commands.registerCommand('go.lint.package', lintCode);
	commands.registerCommand('go.lint.workspace', () => lintCode(true));

	commands.registerCommand('go.vet.package', vetCode);
	commands.registerCommand('go.vet.workspace', () => vetCode(true));

	commands.registerCommand('go.test.generate.package', () => {
		goGenerateTests.generateTestCurrentPackage();
	});
	commands.registerCommand('go.test.generate.file', () => {
		goGenerateTests.generateTestCurrentFile();
	});
	commands.registerCommand('go.test.generate.function', () => {
		goGenerateTests.generateTestCurrentFunction();
	});
	// unmapped:
	// 'go.toggle.test.file': missing command 'open.file'

	commands.registerCommand('go.get.package', goGetPackage);

	commands.registerCommand('go.add.tags', (args) => {
		addTags(args);
	});
	commands.registerCommand('go.remove.tags', (args) => {
		removeTags(args);
	});

	commands.registerCommand('go.playground', playgroundCommand);

	commands.registerCommand('go.show.commands', () => {
		const commandTitles: string[] = [];
		const title2commandId = new Map<string, string>();
		for (let key of commands.commandMap.keys()) {
			const title = CommandConfig.instance.getTitle(key);
			if (title) {
				title2commandId.set(title, key);
				commandTitles.push(title);
			}
		}
		window.showQuickPick(commandTitles).then(pick => {
			const command = title2commandId.get(pick);
			commands.executeCommand(command);
		});
	});

	commands.registerCommand('go.build.package', buildCode);

	commands.registerCommand('go.build.workspace', () => buildCode(true));

	commands.registerCommand('workbench.action.openGlobalSettings', () => {
		lspClient.logMessage({
			message: 'workbench.action.openGlobalSettings is called',
			type: MessageType.Warning
		});
	});
	commands.registerCommand('workbench.action.openWorkspaceSettings', () => {
		lspClient.logMessage({
			message: 'workbench.action.openWorkspaceSettings is called',
			type: MessageType.Warning
		});
	});
	_activated();
}

export function mockActivate(lspClient: LspClient) {
	window.lspClient = lspClient;
	commands.lspClient = lspClient;

	errorDiagnosticCollection.onSet(lspClient.publishDiagnostics.bind(lspClient));
	warningDiagnosticCollection.onSet(lspClient.publishDiagnostics.bind(lspClient));

	_activated();
}