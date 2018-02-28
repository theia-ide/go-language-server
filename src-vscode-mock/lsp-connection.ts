/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from 'vscode-languageserver';

import { LspClientLogger, PrefixingLogger, Logger } from './logger';
import { LspServer } from './lsp-server';
import { LspClientImpl } from './lsp-client';
import { activate } from './activate';

export interface IServerOptions {
	goServerPath: string;
	goServerLogFile?: string;
	goServerLogVerbosity?: string;
	showMessageLevel: lsp.MessageType;
}

export function createLspConnection(options: IServerOptions): lsp.IConnection {
	const connection = lsp.createConnection();
	const lspClient = new LspClientImpl(connection);
	let logger: Logger = new LspClientLogger(lspClient, options.showMessageLevel);
	logger = new PrefixingLogger(logger, '[lspserver]');
	const server: LspServer = new LspServer({
		logger,
		lspClient
	});

	connection.onInitialize(server.initialize.bind(server));
	connection.onInitialized(server.initialized.bind(server));
	connection.onDidOpenTextDocument(server.didOpenTextDocument.bind(server));
	connection.onDidSaveTextDocument(server.didSaveTextDocument.bind(server));
	connection.onDidCloseTextDocument(server.didCloseTextDocument.bind(server));
	connection.onDidChangeTextDocument(server.didChangeTextDocument.bind(server));

	connection.onCodeAction(server.codeAction.bind(server));
	connection.onCodeLens(server.codeLens.bind(server));
	connection.onCodeLensResolve(server.codeLensResolve.bind(server));
	connection.onCompletion(server.completion.bind(server));
	connection.onDefinition(server.definition.bind(server));
	connection.onDocumentFormatting(server.documentFormatting.bind(server));
	connection.onDocumentHighlight(server.documentHighlight.bind(server));
	connection.onDocumentSymbol(server.documentSymbol.bind(server));
	connection.onExecuteCommand(server.executeCommand.bind(server));
	connection.onHover(server.hover.bind(server));
	connection.onReferences(server.references.bind(server));
	connection.onRenameRequest(server.rename.bind(server));
	connection.onSignatureHelp(server.signatureHelp.bind(server));
	connection.onWorkspaceSymbol(server.workspaceSymbol.bind(server));

	return connection;
}
