/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import * as path from 'path';
import * as lsp from 'vscode-languageserver';
import { isArray } from 'util';
import { LspServer } from './lsp-server';
import { testFilePath, testWorkspacePath, uri, writeContents, unlink } from './test-utils';
import { LspClient } from './lsp-client';
import { ConsoleLogger } from './logger';
import { uriToPath } from './utils';
import { TextDocument } from './text-document';
import { getImportablePackages } from '../src/goPackages';
import { workspace, applyEdits } from './vscode';
import { mockActivate } from './activate';
import { homedir } from 'os';
import { buildCode } from '../src/goBuild';

export function position(document: lsp.TextDocumentItem, match: string, count = 1): lsp.Position {
	const doc = new TextDocument(document);
	let i = 0;
	let idx = -1;
	while (i++ < count) {
		idx = doc.getText().indexOf(match, idx + 1);
	}
	const pos = doc.positionAt(idx);
	return {
		line: pos.line,
		character: pos.character
	};
}

const assert = chai.assert;
const expect = chai.expect;

let diagnosticResolve: ((params: lsp.PublishDiagnosticsParams) => void)[] = [];

let server: LspServer;
let client: LspClient;

describe('ls', () => {

	before(async () => {
		client = {
			publishDiagnostics(args: lsp.PublishDiagnosticsParams): void {
				if (diagnosticResolve.length > 0) {
					const resolve = diagnosticResolve.splice(0, 1)[0];
					if (resolve)
						resolve(args);
				}
			},
			showMessage(args: lsp.ShowMessageParams): void {
				throw args; // should not be called.
			},
			logMessage(args: lsp.LogMessageParams): void {
				console.log(args.message);
			},
			async applyWorkspaceEdit(args: lsp.ApplyWorkspaceEditParams): Promise<lsp.ApplyWorkspaceEditResponse> {
				throw new Error('unsupported');
			},
			sendTelemetryEvent(args: any): void { },
			async showMessageRequest(args: lsp.ShowMessageRequestParams): Promise<lsp.MessageActionItem> {
				throw new Error('unsupported');
			},
			async showInformationMessage(msg: string, ...options: string[]): Promise<string | undefined> {
				// throw new Error('unsupported');
				return Promise.resolve('');
			},
			async registerCapability(args: lsp.RegistrationParams): Promise<void> {
				// throw new Error('unsupported');
			}
		};
	
		server = new LspServer({
			logger: console,
			lspClient: client,
		});
		(workspace.getConfiguration('go') as any)['toolsGopath'] = path.resolve(homedir(), 'go');
		await server.initialize({
			rootPath: undefined,
			rootUri: uri(testWorkspacePath()),
			processId: 42,
			capabilities: {}
		});
		mockActivate(client);
	
		server.initialized();
	});
	
	let docs: lsp.TextDocumentItem[] = []

	function openNewDocument(fileName: string, contents: string) {
		const path = testFilePath(fileName);
		writeContents(path, contents);
		const doc = {
			uri: uri(path),
			languageId: 'go',
			version: 1,
			text: contents
		};
		server.didOpenTextDocument({
			textDocument: doc
		});
		docs.push(doc)
		return doc;
	}
	
	afterEach(() => {
		docs.forEach(doc => {
			server.didCloseTextDocument({
				textDocument: doc
			});
			unlink(uriToPath(doc.uri));
		})
		docs = []
	});

	describe('completion', () => {
		it('simple test', async () => {
			const doc = openNewDocument('main.go', `
				package main
				
				func main() {
					fmt.Println("hello world")
				}	
			`);
			await getImportablePackages(uriToPath(doc.uri), true);
			const pos = position(doc, 'fmt.');
			pos.character += 4;
			const proposals = await server.completion({
				textDocument: doc,
				position: pos
			});
			assert.isTrue(proposals.items.length > 40);
			const item = proposals.items[0];
			assert.isTrue(item.detail !== undefined);
			assert.isTrue(proposals.items.some(item => item.insertTextFormat === undefined), 'Expected text proposals');
			assert.isTrue(proposals.items.some(item => item.insertTextFormat === lsp.InsertTextFormat.Snippet), 'Expected snippet proposals');
			assert.isTrue(proposals.items.some(item => {
				if (item.additionalTextEdits !== undefined) {
					const additionalText = item.additionalTextEdits[0].newText;
					return additionalText.indexOf('import') >= 0 && additionalText.indexOf('"fmt"') >= 0;
				}
				return false;
			}));
		});
	});
	
	describe('definition', () => {
		it('simple test', async () => {
			const doc = openNewDocument('main.go', `
				package main
				
				func main() {
					foo()
				}	
	
				func foo() {
				}
			`);
			await getImportablePackages(uriToPath(doc.uri), true);
			const pos = position(doc, 'foo');
			const definition = await server.definition({
				textDocument: doc,
				position: pos
			});
			const definitionPos = position(doc, 'foo', 2);
			assert.isFalse(isArray(definition));
			assert.equal(definitionPos.line, (definition as lsp.Location).range.start.line);
			assert.equal(definitionPos.character, (definition as lsp.Location).range.start.character);
		});
	});
	
	describe('diagnostics', () => {
		it('simple test', async () => {
			let diagnosticPromise0 = new Promise<lsp.PublishDiagnosticsParams>((resolve, reject) => {
				diagnosticResolve.push(resolve);
			});
			const doc = openNewDocument('main.go', `
				package main
				
				func main() {
					foo2()
				}	
	
				func foo() {
				}
			`);
			let diagnosticPromise1 = new Promise<lsp.PublishDiagnosticsParams>((resolve, reject) => {
				diagnosticResolve.push(resolve);
			});
			buildCode(false);
			const diagnostics0 = (await diagnosticPromise0).diagnostics;
			//assert.equal(1, diagnostics0.length);
			const diagnostics1 = (await diagnosticPromise1).diagnostics;
			assert.equal(1, diagnostics1.length);
			assert.equal('undefined: foo2', diagnostics1[0].message);
		});
	});
	
	
	describe('symbol', () => {
		it('simple test', async () => {
			const doc = openNewDocument('main.go', `
				package main
				
				import "fmt"
	
				func main() {
					fmt.Println("");
				}	
	
				func foo() {
				}
			`);
			const symbols = await server.documentSymbol({
				textDocument: doc
			});
			assert.equal(3, symbols.length);
			assert.equal('main', symbols[0].name);
			assert.equal('main', symbols[1].name);
			assert.equal('foo', symbols[2].name);
		});
	});
	
	
	describe('formatting', () => {
		it('full document formatting', async () => {
			const doc = openNewDocument('main.go',
				` package
	test 
	import  
	"fmt"
	
	func foo(x string) { 
	fmt   . Println("    ");	foo("")
	}`);
			const edits = await server.documentFormatting({
				textDocument: doc,
				options: {
					tabSize: 4,
					insertSpaces: true
				}
			});
			const result = applyEdits(doc.text, edits);
			assert.equal(
`package test

import "fmt"

func foo(x string) {
	fmt.Println("    ")
	foo("")
}
`			, result);
		});
	});
	
	
	describe('signatureHelp', () => {
		it('simple test', async () => {
			const doc = openNewDocument('main.go', `
				package test
				func foo(x string, baz bool) {
					foo("",true)
				}			
			`);
			let result = await server.signatureHelp({
				textDocument: doc,
				position: position(doc, '""')
			});
			assert.equal('x string', result.signatures[result.activeSignature!].parameters![result.activeParameter!].label);
			result = await server.signatureHelp({
				textDocument: doc,
				position: position(doc, 'true)')
			});
			assert.equal('baz bool', result.signatures[result.activeSignature!].parameters![result.activeParameter!].label);
		});
	});
	
	describe('hover', () => {
		it('simple test', async () => {
			const doc = openNewDocument('main.go', `
				package test
				// Foo is dangerous 
				func Foo(x string, baz bool) {
					return Foo("",true);
				}			
			`);
			let result = await server.hover({
				textDocument: doc,
				position: position(doc, 'Foo(x')
			});
			assert.equal('Foo func(x string, baz bool)', result.contents[0].value);
			assert.equal('Foo is dangerous\n', result.contents[1]);
		});
	});
	
	// describe('rename', () => {
	// 	it('simple test', async () => {
	// 		const doc = openNewDocument('main.go', `
	// 			package test
	//
	// 			func foo(x string) string {
	// 				return foo("");
	// 			}
	// 		`);
	// 		let result = await server.rename({
	// 			textDocument: doc,
	// 			position: position(doc, 'foo'),
	// 			newName: 'bar'
	// 		});
	// 		// TODO expectation
	// 	});
	// });
	
	describe('references', () => {
		it('simple test', async () => {
			const doc = openNewDocument('main.go', `
				package test
				
				func foo(x string) string {
					return foo("");
				}
			`);
			let result = await server.references({
				textDocument: doc,
				position: position(doc, 'foo')
			});
			assert.equal(2, result.length);
		});
	});
});	
