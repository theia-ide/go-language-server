/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { readFile } from 'fs';
import * as path from 'path';
import { CompletionItem } from './types';
import * as lsp from 'vscode-languageserver';

export class SnippetProposalProvider {

	readonly proposals: CompletionItem[] = [];

	constructor() {
		const snippetPath = path.resolve(__dirname, '..', '..', 'snippets', 'go.json');
		readFile(snippetPath, 'UTF-8', (err: any, data: string) => {
			if (!err) {
				const snippets = JSON.parse(data)['.source.go'];
				for (let description in snippets) {
					const snippet = snippets[description];
					const item = new CompletionItem(snippet.prefix, lsp.CompletionItemKind.Snippet);
					item.insertText = snippet.body;
					item.insertTextFormat = lsp.InsertTextFormat.Snippet;
					item.detail = description;
					item.sortText = 'b';
					this.proposals.push(item);
				}
			}
		});
	}
}



