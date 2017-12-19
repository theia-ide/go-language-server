/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { readFileSync } from 'fs';
import * as path from 'path';
import { CompletionItem } from './types';
import * as lsp from 'vscode-languageserver';
import { Logger } from './logger';

export class SnippetProposalProvider {

	readonly proposals: CompletionItem[] = [];

	constructor(logger: Logger) {
		const snippetPath = path.resolve(__dirname, '..', '..', 'snippets', 'go.json');
		try {
			const data = readFileSync(snippetPath, 'UTF-8');
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
		} catch (err) {
			logger.error(this, 'Error reading snippets', err);
		}
	}
}



