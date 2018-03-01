/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from 'vscode-languageserver';
import Uri  from 'vscode-uri';

import { Logger, PrefixingLogger } from './logger';
import { LspClient } from './lsp-client';
import { SnippetProposalProvider } from './snippet-proposal-provider';
import { TextDocument } from './text-document';
import { TextEditor } from './text-editor';
import { Location, CodeLens, Range } from './types';
import { uriToPath, uriToStringUri } from './utils';
import { window } from './window';
import { workspace, WorkspaceFolder } from './workspace';
import { buildCode } from '../src/goBuild';
import { commands } from './commands';

import { GoCodeActionProvider } from '../src/goCodeAction';
import { GoCompletionItemProvider } from '../src/goSuggest';
import { GoDefinitionProvider } from '../src/goDeclaration';
import { GoDocumentFormattingEditProvider } from '../src/goFormat';
import { GoDocumentSymbolProvider } from '../src/goOutline';
import { GoHoverProvider } from '../src/goExtraInfo';
import { GoReferenceProvider } from '../src/goReferences';
import { GoReferencesCodeLensProvider } from '../src/goReferencesCodelens';
import { GoRunTestCodeLensProvider } from '../src/goRunTestCodelens';
import { GoRenameProvider } from '../src/goRename';
import { GoSignatureHelpProvider } from '../src/goSignature';
import { GoWorkspaceSymbolProvider } from '../src/goSymbol';
import { Selection } from './vscode';
import { activate } from './activate';
import { TextDocumentIdentifier } from 'vscode-languageserver';

export interface IServerOptions {
	logger: Logger;
	lspClient: LspClient;
}

export const WORKSPACE_EDIT_COMMAND = 'workspace-edit';

export class LspServer {

	private initializeParams: lsp.InitializeParams;
	private initializeResult: lsp.InitializeResult;

	private openedDocumentUris = new Map<string, TextDocument>();
	private logger: Logger;

	private codeActionProvider: GoCodeActionProvider;
	private completionItemProvider: GoCompletionItemProvider;
	private definitionProvider: GoDefinitionProvider;
	private documentSymbolProvider: GoDocumentSymbolProvider;
	private formattingProvider: GoDocumentFormattingEditProvider;
	private hoverProvider: GoHoverProvider;
	private renameProvider: GoRenameProvider;
	private referenceProvider: GoReferenceProvider;
	private referenceCodeLensProvider: GoReferencesCodeLensProvider;
	private signatureHelpProvider: GoSignatureHelpProvider;
	private snippetProposalProvider: SnippetProposalProvider;
	private testCodeLensProvider: GoRunTestCodeLensProvider;
	private workspaceSymbolProvider: GoWorkspaceSymbolProvider;

	private hasStartedInitialBuild = false;

	private activated: () => void;
	private activation = new Promise<void>((resolve, reject) => {
		this.activated = resolve;
	});

	constructor(private options: IServerOptions) {
		this.logger = options.logger;
	}

	public async initialize(params: lsp.InitializeParams): Promise<lsp.InitializeResult> {
		this.logger.log('initialize', params);
		this.initializeParams = params;
		workspace.workspaceFolders.push(new WorkspaceFolder(Uri.parse(params.rootUri)));
		this.initializeResult = {
			capabilities: {
				textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
				completionProvider: {
					triggerCharacters: ['.'],
					resolveProvider: false
				},
				codeActionProvider: true,
				codeLensProvider: {
					resolveProvider: true
				},
				definitionProvider: true,
				documentFormattingProvider: true,
				documentHighlightProvider: true,
				documentSymbolProvider: true,
				executeCommandProvider: {
					commands: [WORKSPACE_EDIT_COMMAND]
				},
				hoverProvider: true,
				renameProvider: true,
				referencesProvider: true,
				signatureHelpProvider: {
					triggerCharacters: ['(', ',']
				},
				workspaceSymbolProvider: true,
			}
		};
		this.logger.log('onInitialize result', this.initializeResult);
		return this.initializeResult;
	}

	public async initialized(): Promise<void> {
		return activate(this.options.lspClient, this, this.logger).then(() => {
			this.codeActionProvider = new GoCodeActionProvider();
			this.completionItemProvider = new GoCompletionItemProvider();
			this.definitionProvider = new GoDefinitionProvider();
			this.documentSymbolProvider = new GoDocumentSymbolProvider();
			this.formattingProvider = new GoDocumentFormattingEditProvider();
			this.hoverProvider = new GoHoverProvider();
			this.renameProvider = new GoRenameProvider();
			this.referenceProvider = new GoReferenceProvider();
			this.referenceCodeLensProvider = new GoReferencesCodeLensProvider();
			this.signatureHelpProvider = new GoSignatureHelpProvider();
			this.snippetProposalProvider = new SnippetProposalProvider(this.logger);
			this.testCodeLensProvider = new GoRunTestCodeLensProvider();
			this.workspaceSymbolProvider = new GoWorkspaceSymbolProvider();
			this.activated();
		});
	}

	public async didOpenTextDocument(params: lsp.DidOpenTextDocumentParams): Promise<void> {
		await this.activation;
		const path = uriToPath(params.textDocument.uri);
		this.logger.log('onDidOpenTextDocument', params, path);
		const document = new TextDocument(params.textDocument);
		this.openedDocumentUris.set(params.textDocument.uri, document);
		const editor = new TextEditor(document, this.options.lspClient);
		window.visibleTextEditors.push(editor);
		window.activeTextEditor = editor;

		// doBuild requires an active editor so we start the initial build this late
		this.hasStartedInitialBuild = true;
		buildCode(false);
	}

	public async didCloseTextDocument(params: lsp.DidOpenTextDocumentParams): Promise<void> {
		await this.activation;
		const path = uriToPath(params.textDocument.uri);
		this.logger.log('onDidCloseTextDocument', params, path);
		this.openedDocumentUris.delete(params.textDocument.uri);
		const uri = Uri.parse(params.textDocument.uri);
		let i = 0;
		for (; i < window.visibleTextEditors.length; ++i) {
			if (window.visibleTextEditors[i].document.uri === uri)
				break;
		}
		if (i < window.visibleTextEditors.length)
			window.visibleTextEditors.splice(i);
	}

	public async didChangeTextDocument(params: lsp.DidChangeTextDocumentParams): Promise<void> {
		await this.activation;
		return this.executeOnDocument('onDidCloseTextDocument', params, async document => {
			document.apply(params.contentChanges, params.textDocument.version);
		});
	}

	public async didSaveTextDocument(params: lsp.DidChangeTextDocumentParams): Promise<void> {
		await this.activation;
		return this.executeOnDocument('onDidSaveTextDocument', params, async document => {
			document.save();
		}).then(() => buildCode(false));
	}

	public async definition(params: lsp.TextDocumentPositionParams): Promise<lsp.Definition> {
		await this.activation;
		return this.executeOnDocument('definition', params, async document => {
			const definition = await this.definitionProvider.provideDefinition(document, params.position, lsp.CancellationToken.None);
			if (definition) {
				const result: lsp.Definition = {
					uri: definition.uri,
					range: definition.range,
				};
				return result;
			} else
				return [];
		});
	}

	public async documentSymbol(params: lsp.DocumentSymbolParams): Promise<lsp.SymbolInformation[]> {
		await this.activation;
		return this.executeOnDocument('symbol', params, async document => {
			const symbolInformation = await this.documentSymbolProvider.provideDocumentSymbols(document, lsp.CancellationToken.None);
			symbolInformation.forEach(symbol => {
				symbol.location = new Location(symbol.range, uriToStringUri(document.uri));
			});
			return symbolInformation;
		});
	}

	public async completion(params: lsp.TextDocumentPositionParams): Promise<lsp.CompletionList> {
		await this.activation;
		return this.executeOnDocument('completion', params, async document => {
			const items = await this.completionItemProvider.provideCompletionItems(document, params.position, lsp.CancellationToken.None);
			return {
				isIncomplete: false,
				items: items.concat(this.snippetProposalProvider.proposals)
			};
		});
	}

	public async hover(params: lsp.TextDocumentPositionParams): Promise<lsp.Hover> {
		await this.activation;
		return this.executeOnDocument('hover', params, async document => {
			return this.hoverProvider.provideHover(document, params.position, lsp.CancellationToken.None);
		});
	}

	public async rename(params: lsp.RenameParams): Promise<lsp.WorkspaceEdit> {
		await this.activation;
		return this.executeOnDocument('onRename', params, async document => {
			return this.renameProvider.provideRenameEdits(document, params.position, params.newName, lsp.CancellationToken.None);
		});
	}

	public async references(params: lsp.TextDocumentPositionParams): Promise<lsp.Location[]> {
		await this.activation;
		return this.executeOnDocument('onReferences', params, async document => {
			return this.referenceProvider.provideReferences(document, params.position, { includeDeclaration: true}, lsp.CancellationToken.None);
		});
	}

	public async documentFormatting(params: lsp.DocumentFormattingParams): Promise<lsp.TextEdit[]> {
		await this.activation;
		return this.executeOnDocument('format', params, async document => {
			return this.formattingProvider.provideDocumentFormattingEdits(document, params.options, lsp.CancellationToken.None);
		});
	}

	public async signatureHelp(params: lsp.TextDocumentPositionParams): Promise<lsp.SignatureHelp> {
		await this.activation;
		return this.executeOnDocument('signatureHelp', params, async document => {
			return this.signatureHelpProvider.provideSignatureHelp(document, params.position, lsp.CancellationToken.None);
		});
	}

	public async codeAction(params: lsp.CodeActionParams): Promise<lsp.Command[]> {
		await this.activation;
		return this.executeOnDocument('codeAction', params, async document => {
			return this.codeActionProvider.provideCodeActions(document, new Range(params.range), params.context, lsp.CancellationToken.None);
		});
	}

	public async codeLens(params: lsp.CodeLensParams): Promise<lsp.CodeLens[]> {
		await this.activation;
		return this.executeOnDocument('codeLens', params, async document => {
			const referenceCodeLenses = await this.referenceCodeLensProvider.provideCodeLenses(document, lsp.CancellationToken.None);
			const testCodeLenses = await this.testCodeLensProvider.provideCodeLenses(document, lsp.CancellationToken.None);
			const allCodeLenses = referenceCodeLenses.concat(testCodeLenses);

			const result: lsp.CodeLens[] = allCodeLenses.map((lens: CodeLens) : lsp.CodeLens => {
				return {
					range: lens.range,
					data: {
						textDocument: params.textDocument,
					}
				};
			});

			return result;
		});
	}

	public async codeLensResolve(codeLens: CodeLens): Promise<CodeLens> {
		await this.activation;
		if (!codeLens.command) {
			codeLens.document = this.getOpenDocument(codeLens.data.textDocument.uri);

			const resolvedCodeLens: CodeLens = await this.referenceCodeLensProvider.resolveCodeLens(codeLens, lsp.CancellationToken.None);
			const result: lsp.CodeLens = {
				range: resolvedCodeLens.range,
				command: resolvedCodeLens.command,
				data: resolvedCodeLens.data,
			};

			return result;
		} else {
			return codeLens;
		}
	}

	public async executeCommand(params: lsp.ExecuteCommandParams): Promise<any> {
		await this.activation;
		this.logger.log('executeCommand', params);
		const args = params.arguments;
		const document = this.getOpenDocument(args[args.length - 2] as string);
		const selection = args[args.length - 1] as Range;
		this.activateEditor(document, selection);
		return commands.executeCommand(params.command, ...args.slice(0, -2));
	}

	public async documentHighlight(arg: lsp.TextDocumentPositionParams): Promise<lsp.DocumentHighlight[]> {
		await this.activation;
		this.logger.log('documentHighlight', arg);
		// TODO
		return [];
	}

	public async workspaceSymbol(params: lsp.WorkspaceSymbolParams): Promise<lsp.SymbolInformation[]> {
		await this.activation;
		this.logger.log('symbol', params);
		return this.workspaceSymbolProvider.provideWorkspaceSymbols(params.query, lsp.CancellationToken.None);
	}

	private executeOnDocument<T>(serviceName: string, params: { textDocument: lsp.TextDocumentIdentifier }, lambda: (document: TextDocument) => Promise<T>): Promise<T> {
		const path = uriToPath(params.textDocument.uri);
		this.logger.log(serviceName, params, path);
		const document = this.getOpenDocument(params.textDocument.uri);
		this.activateEditor(document);
		return (lambda.call(this, document) as Promise<T>).catch(err => {
			this.options.lspClient.showMessage({
				message: err,
				type: lsp.MessageType.Error
			});
			throw new lsp.ResponseError(lsp.ErrorCodes.InvalidRequest, err, err);
		});
	}

	private getOpenDocument(uri: string): TextDocument {
		const doc = this.openedDocumentUris.get(uri);
		if (doc) {
			return doc;
		} else {
			throw new Error('Document ' + uri + ' has not been opened.');
		}
	}

	private activateEditor(document: TextDocument, selection?: lsp.Range): TextDocument {
		window.activeTextEditor = window.visibleTextEditors.find(editor => editor.document.uri === document.uri);
		if (selection)
			window.activeTextEditor.selection = new Selection(new Range(selection.start, selection.end));
		return document;
	}
}
