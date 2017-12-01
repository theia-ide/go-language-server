import { workspace } from './workspace';
import { LspClient } from './lsp-client';
import { TextDocument } from './text-document';
import { Position, Range, WorkspaceEdit } from './types';
import * as lsp from 'vscode-languageserver';
import { TextEdit } from 'vscode-languageserver';

export class TextEditor {

	selection: Range

	constructor(readonly document: TextDocument, readonly lspClient: LspClient) {
		this.selection = new Range(0, 0, 0, 0)
	}

	edit(editBuilder: (edit: TextEditorEdit) => void) {
		const textEditorEdit = new TextEditorEdit()
		editBuilder.call(null, textEditorEdit)
		const workspaceEdit = new WorkspaceEdit()
		workspaceEdit.set(this.document.uri, textEditorEdit.textEdits)
		this.lspClient.applyWorkspaceEdit({ edit: workspaceEdit })
	}
}

export class TextEditorEdit {

	public textEdits: lsp.TextEdit[] = []

	replace(location: Position | Range /*| Selection*/, newText: string): void {
		if (lsp.Position.is(location))
			this.textEdits.push(TextEdit.replace(new Range(location, location), newText))
		else
			this.textEdits.push(TextEdit.replace(location, newText))
	}

	insert(location: Position, newText: string): void  {
		this.textEdits.push(TextEdit.insert(location, newText))

	}

	delete(location: Range /*| Selection*/): void {
		this.textEdits.push(TextEdit.del(location))
	}
}
