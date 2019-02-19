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
import { updateGoPathGoRootFromConfig, offerToInstallTools, installAllTools } from '../src/goInstallTools';
import { getCurrentGoPath, getToolsGopath } from '../src/util';
import { runFillStruct } from '../src/goFillStruct';

export async function activate(lspClient: LspClient, lspServer: LspServer, logger: Logger): Promise<void> {
	outputChannel.lspClient = lspClient;
	window.lspClient = lspClient;

	console.log = logger.log.bind(logger);
	console.error = logger.error.bind(logger);
	console.warn = logger.warn.bind(logger);
	console.info = logger.info.bind(logger);

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
		if (getToolsGopath()) {
			window.showInformationMessage('toolsGopath: ' + getToolsGopath());
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

	commands.registerCommand('go.tools.install', installAllTools);
	commands.registerCommand('go.fill.struct', () => {
		runFillStruct(window.activeTextEditor);
	});

	return updateGoPathGoRootFromConfig().then(() => {
		lspClient.sendTelemetryEvent(workspace.getConfiguration('go'));
		offerToInstallTools();
	});
}

export function mockActivate(lspClient: LspClient) {
	window.lspClient = lspClient;
	commands.lspClient = lspClient;

	errorDiagnosticCollection.onSet(lspClient.publishDiagnostics.bind(lspClient));
	warningDiagnosticCollection.onSet(lspClient.publishDiagnostics.bind(lspClient));
}