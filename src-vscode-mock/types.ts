import { TextDocument } from './text-document';
import { uriToStringUri } from './utils';
import { ForkOptions } from 'child_process';
import * as lsp from 'vscode-languageserver';
import URI from 'vscode-uri'

export interface CodeActionContext extends lsp.CodeActionContext {}

export class CodeLens implements lsp.CodeLens {
	data?: any
	
	document?: TextDocument

	constructor(public range: Range, public command?: Command) {
	}
}

export interface Command extends lsp.Command {}

export class CompletionItem implements lsp.CompletionItem {
	detail?: string;
	documentation?: string;
	sortText?: string;
	filterText?: string;
	insertText?: string;
	insertTextFormat?: lsp.InsertTextFormat;
	textEdit?: lsp.TextEdit;
	additionalTextEdits?: lsp.TextEdit[];
	commitCharacters?: string[];
	command?: lsp.Command;
	data?: any;

	constructor(public label: string, public kind?: lsp.CompletionItemKind) { }
}

export type Definition = Location | Location[] | null;

export interface DocumentFilter {
	language: string
	scheme: string
}

export class ExtensionContext {
	subscriptions: any[] = []
	globalState: GlobalState
}

export class FormattingOptions { }

export class GlobalState {

	get<T>(key: string, defaultValue?: T): T | undefined {
		return undefined
	}

	update(key: string, value: any): Thenable<void> {
		return undefined
	}
}

export class Hover implements lsp.Hover {
	constructor(public readonly contents: lsp.MarkedString | lsp.MarkedString[], public readonly range?: lsp.Range) {}
}

export namespace InsertTextFormat {
	export const PlainText = 1;
	export const Snippet = 2;
}

export class Location implements lsp.Location {
	uri: string
	range: lsp.Range

	constructor(range: lsp.Range, uri: string) 
	constructor(uri: URI, range: lsp.Range) 
	constructor(uri: URI, position: lsp.Position) 
	constructor(public readonly rangeOrUri: lsp.Range | URI, public readonly uriRangeOrPosition: string | lsp.Range | lsp.Position) { 
		if(lsp.Range.is(rangeOrUri)) 
			this.range = rangeOrUri
		else 
			this.uri = uriToStringUri(rangeOrUri)
		if(lsp.Range.is(uriRangeOrPosition)) 
			this.range = uriRangeOrPosition
		else if(lsp.Position.is(uriRangeOrPosition))
			this.range = new Range(uriRangeOrPosition, uriRangeOrPosition)
		else
			this.uri = uriRangeOrPosition
	}
}

export type MarkedString = lsp.MarkedString

export class ParameterInformation implements lsp.ParameterInformation {
	constructor(public readonly label: string, public readonly documentation?: string) {}
}

export class Position implements lsp.Position {
	constructor(public readonly line: number, public readonly character: number) { }
}

export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;

export class Range implements lsp.Range {
	readonly start: lsp.Position
	readonly end: lsp.Position

	constructor(range: lsp.Range)
	constructor(start: lsp.Position, end: lsp.Position)
	constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number)
	constructor(first: lsp.Position | number | lsp.Range, second?: lsp.Position | number,
		endLine: number = -1, endCharacter: number = -1) {
		if (lsp.Range.is(first)) { 
			this.start = first.start
			this.end = first.end
		} else if (lsp.Position.is(first) && lsp.Position.is(second)) {
			this.start = first as Position
			this.end = second as Position
		} else {
			this.start = new Position(first as number, second as number)
			this.end = new Position(endLine, endCharacter)
		}
	}

	static contains(range: lsp.Range, position: lsp.Position) : boolean {
		return (range.start.line < position.line 
				|| (range.start.line == position.line && range.start.character <= position.character))
			&& (range.end.line > position.line
				|| (range.end.line == position.line && range.end.character >= position.character))
	}

	isEmpty() : boolean {
		return this.start.line === this.end.line
		&& this.start.character === this.end.character
	}
}

export class SignatureHelp implements lsp.SignatureHelp {
	signatures: SignatureInformation[];
    activeSignature: number | null;
    activeParameter: number | null;
}

export class SignatureInformation implements lsp.SignatureInformation {
		parameters: ParameterInformation[] = [];
	
	constructor(public readonly label: string, public readonly documentation?: string/* | MarkdownString*/) {}
}

export class StatusBarItem {
	text: string;
	tooltip: string | undefined;
	color: string /*| ThemeColor*/ | undefined;
	command: string | undefined;
	show(): void { };
	hide(): void { };
	dispose(): void { };

	constructor(public readonly alignment: StatusBarAlignment, public readonly priority: number) { }
}

export enum StatusBarAlignment {
	Left = 1,
	Right = 2
}

export class SymbolInformation implements lsp.SymbolInformation {
	uri: string
	location: lsp.Location | undefined

	constructor(public readonly name: string,
		public readonly kind: lsp.SymbolKind,
		public readonly range: lsp.Range,
		uri: URI,
		public readonly containerName?: string) {
		if(uri)
			this.location = new Location(range, uriToStringUri(uri))
	}
}

export class TextEdit implements lsp.TextEdit {
	constructor(public readonly range: lsp.Range, public readonly newText: string) { }

	static insert(position: Position, text: string)  {
		return new TextEdit(new Range(position, position), text)
	}

	static delete(range: Range) {
		return new TextEdit(range, '')
	}

	static replace(range: Range, text: string)  {
		return new TextEdit(range, text)
	}
}


export class WorkspaceEdit implements lsp.WorkspaceEdit {
	changes: {
		[uri: string]: TextEdit[];
	} = {}

	set(uri: URI, edits: TextEdit[]) {
		this.changes[uriToStringUri(uri)] = edits
	}

	add(uri: URI, edit: TextEdit) {
		const existing = this.changes[uriToStringUri(uri)]
		if (existing)
			existing.push(edit)
		else
			this.set(uri, [edit])
	}

	insert(uri: URI, position: Position, text: string)  {
		this.add(uri, new TextEdit(new Range(position, position), text))
	}

	delete(uri: URI, range: Range) {
		this.add(uri, new TextEdit(range, ''))
	}

	replace(uri: URI, range: Range, text: string)  {
		this.add(uri, new TextEdit(range, text))
	}

}