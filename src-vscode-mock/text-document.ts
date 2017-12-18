import * as lsp from 'vscode-languageserver';
import URI from 'vscode-uri';

export interface Line {
	text: string;
}

function applyEdits(before: string, edits: lsp.TextEdit[]): string {
	const sorted = edits.sort((a, b) => {
		if (a.range.start.line === b.range.start.line) {
			return a.range.start.character - b.range.start.character;
		}
		return a.range.start.line - b.range.start.line;
	});
	const doc = lsp.TextDocument.create('', '', 0, before);
	let currentDoc = '';
	let offset = 0;
	for (const edit of sorted) {
		const startOffset = doc.offsetAt(edit.range.start);
		currentDoc += before.substr(offset, startOffset - offset) + edit.newText;
		offset = doc.offsetAt(edit.range.end);
	}
	return currentDoc + before.substr(offset);
}

export class TextDocument {

	public readonly uri: URI;
	text: string;
	version: number = 0;
	lastAccessed: number = new Date().getTime();

	constructor(doc: lsp.TextDocumentItem) {
		this.text = doc.text;
		this.uri = URI.parse(doc.uri);
		if (lsp.VersionedTextDocumentIdentifier.is(doc)) {
			this.version = doc.version;
		}
	}

	private get lines() {
		return this.text.split('\n');
	}

	get lineCount(): number {
		return this.lines.length;
	}

	get languageId() {
		return 'go';
	}

	getText(range?: lsp.Range)  {
		if (!range)
			return this.text;
		const offset = this.offsetAt(range.start);
		const length = this.offsetAt(range.end) - offset;
		return this.text.substr(offset, length);
	}

	getWordRangeAtPosition(position: lsp.Position): lsp.Range |  undefined {
		const lines = this.lines;
		const line = Math.min(lines.length - 1, Math.max(0, position.line));
		const lineText = lines[line];
		const character = Math.min(lineText.length - 1, Math.max(0, position.character));
		let startChar = character;
		while (startChar > 0 && !/\s/.test(lineText.charAt(startChar - 1)))
			--startChar;
		let endChar = character;
		while (endChar < lineText.length - 1 && !/\s/.test(lineText.charAt(endChar)))
			++endChar;
		if (startChar === endChar)
			return undefined;
		else
			return lsp.Range.create(line, startChar, line, endChar);
	}

	lineAt(line: number): Line {
		return {
			text: this.lines[line]
		};
	}

	getPosition(offset: number): lsp.Position {
		if (offset > this.text.length) {
			throw new Error('offset ' + offset + ' is out of bounds. Document length was ' + this.text.length);
		}
		const lines = this.lines;
		let currentOffSet = 0;
		for (let i = 0; i < lines.length; i++) {
			const l = lines[i];
			if (currentOffSet + l.length > offset) {
				return {
					line: i,
					character: offset - currentOffSet
				};
			} else {
				currentOffSet += l.length + 1;
			}
		}
		return {
			line: lines.length - 1,
			character: lines[lines.length - 1].length
		};
	}

	positionAt(offset: number): lsp.Position {
		return this.getPosition(offset);
	}

	offsetAt(position: lsp.Position): number {
		const lines = this.text.split('\n');
		let currentOffSet = 0;
		for (let i = 0; i < lines.length; i++) {
			const l = lines[i];
			if (position.line === i) {
				if (l.length < position.character) {
					throw new Error(`Position ${JSON.stringify(position)} is out of range. Line [${i}] only has length ${l.length}.`);
				}
				return currentOffSet + position.character;
			} else {
				currentOffSet += l.length + 1;
			}
		}
		throw new Error(`Position ${JSON.stringify(position)} is out of range. Document only has ${lines.length} lines.`);
	}

	apply(contentChanges: lsp.TextDocumentContentChangeEvent[], version: number) {
		this.applyEdits(contentChanges.map(e => {
			const range = e.range || lsp.Range.create(lsp.Position.create(0, 0), this.getPosition(e.rangeLength || 0));
			return lsp.TextEdit.replace(range, e.text);
		}));
		this.version = version;
	}

	applyEdits(edits: lsp.TextEdit[]) {
		this.text = applyEdits(this.text, edits);
		this.lastAccessed = new Date().getTime();
	}

	async save(): Promise<void> {
		// TODO sync with disc?
	}

	get fileName(): string {
		return this.uri.fsPath;
	}

	get isUntitled(): boolean {
		return false;
	}

	get isDirty(): boolean {
		return false;
	}
}

export class TextDocumentChangeEvent {
	document: TextDocument;
}