/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import * as lsp from 'vscode-languageserver';
import { isArray } from 'util';
import { LspServer } from './lsp-server';
import { testFilePath, testWorkspacePath, uri, writeContents } from './test-utils';
import { LspClient } from './lsp-client';
import { ConsoleLogger } from './logger';
import { Deferred, uriToPath } from './utils';
import { TextDocument } from './text-document';
import { getImportablePackages, isAllowToImportPackage } from '../src/goPackages';
import { Range } from './vscode';

export function position(document: lsp.TextDocumentItem, match: string, count = 1): lsp.Position {
	const doc = new TextDocument(document);
	let i = 0;
	let idx = -1;
	while(i++ < count) {
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

let diagnostics: lsp.PublishDiagnosticsParams | undefined;

let server: LspServer;

before(async () => {
	server = new LspServer({
		logger: new ConsoleLogger(),
		lspClient: {
			publishDiagnostics(args: lsp.PublishDiagnosticsParams): void {
				diagnostics = args;
			},
			showMessage(args: lsp.ShowMessageParams): void {
				throw args; // should not be called.
			},
			logMessage(args: lsp.LogMessageParams): void {
				throw args; // should not be called.
			},
			async applyWorkspaceEdit(args: lsp.ApplyWorkspaceEditParams): Promise<lsp.ApplyWorkspaceEditResponse> {
				throw new Error('unsupported');
			},
			sendTelemetryEvent(args: any): void {},
			async showMessageRequest(args: lsp.ShowMessageRequestParams): Promise<lsp.MessageActionItem> {
				throw new Error('unsupported');
			},
			async showInformationMessage(msg: string, ...options: string[]): Promise<string | undefined> {
				throw new Error('unsupported');
			},
			async registerCapability(args: lsp.RegistrationParams): Promise<void> {
				throw new Error('unsupported');
			}
		},
	});

	await server.initialize({
		rootPath: undefined,
		rootUri: uri(testWorkspacePath()),
		processId: 42,
		capabilities: {}
	});
});

export function openNewDocument(fileName: string, contents: string) {
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
	return doc;
}

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

// describe('diagnostics', () => {
//	 it('simple test', async () => {
//		 const doc = {
//			 uri: uri('bar.go'),
//			 languageId: 'go',
//			 version: 1,
//			 text: `
//				 export function foo(): void {
//					 unknown('test')
//				 }
//			 `
//		 }
//		 server.didOpenTextDocument({
//			 textDocument: doc
//		 })
//		 await server.requestDiagnostics()
//		 await server.requestDiagnostics()
//		 const diags = diagnostics!.diagnostics;
//		 assert.equal(1, diags.length);
//		 assert.equal("Cannot find name 'unknown'.", diags[0].message);
//	 });
// });


// describe('symbol', () => {
//	 it('simple test', async () => {
//		 const doc = {
//			 uri: uri('bar.go'),
//			 languageId: 'go',
//			 version: 1,
//			 text: `
//				 export class Foo {
//					 protected foo: string;
//					 public myFunction(arg: string) {
//					 }
//				 }
//			 `
//		 }
//		 server.didOpenTextDocument({
//			 textDocument: doc
//		 })
//		 const symbols = await server.documentSymbol({
//			 textDocument: doc,
//			 position: lsp.Position.create(1, 1)
//		 })
//		 assert.equal(4, symbols.length);
//		 assert.equal('"bar"', symbols[0].name)
//		 assert.equal('Foo', symbols[1].name)
//		 assert.equal('foo', symbols[2].name)
//		 assert.equal('myFunction', symbols[3].name)
//	 });
// });

// describe('editing', () => {
//	 it('open and change', async () => {
//		 const doc = {
//			 uri: uri('bar.go'),
//			 languageId: 'go',
//			 version: 1,
//			 text: `
//				 export function foo(): void {
//				 }
//			 `
//		 }
//		 server.didOpenTextDocument({
//			 textDocument: doc
//		 })
//		 server.didChangeTextDocument({
//			 textDocument: doc,
//			 contentChanges: [
//				 {
//					 text: `
//					 export function foo(): void {
//						 unknown('test');
//					 }
//					 `
//				 }
//			 ]
//		 })
//		 await server.requestDiagnostics()
//		 await server.requestDiagnostics()
//		 const diags = diagnostics!.diagnostics;
//		 assert.equal(1, diags.length);
//		 assert.equal("Cannot find name 'unknown'.", diags[0].message);
//	 });
// });



// describe('formatting', () => {
//	 it('full document formatting', async () => {
//		 const doc = {
//			 uri: uri('bar.go'),
//			 languageId: 'go',
//			 version: 1,
//			 text: 'export	function foo (		 )	 :	void	 {	 }'
//		 }
//		 server.didOpenTextDocument({
//			 textDocument: doc
//		 })
//		 const edits = await server.documentFormatting({
//			 textDocument: doc,
//			 options: {
//				 tabSize: 4,
//				 insertSpaces: true
//			 }
//		 })
//		 const result = applyEdits(doc.text, edits);
//		 assert.equal('export function foo(): void { }', result)
//	 });
// });


// describe('signatureHelp', () => {
//	 it('simple test', async () => {
//		 const doc = {
//			 uri: uri('bar.go'),
//			 languageId: 'go',
//			 version: 1,
//			 text: `
//				 export function foo(bar: string, baz?:boolean): void {}
//				 foo(param1, param2)
//			 `
//		 }
//		 server.didOpenTextDocument({
//			 textDocument: doc
//		 })
//		 let result = await server.signatureHelp({
//			 textDocument: doc,
//			 position: position(doc, 'param1')
//		 })

//		 assert.equal('bar: string', result.signatures[result.activeSignature!].parameters![result.activeParameter!].label)

//		 result = await server.signatureHelp({
//			 textDocument: doc,
//			 position: position(doc, 'param2')
//		 })

//		 assert.equal('baz?: boolean', result.signatures[result.activeSignature!].parameters![result.activeParameter!].label)
//	 });
// });