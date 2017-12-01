import { DiagnosticCollection } from './diagnostics';
import { mockFunction } from './mock-error'
import { TextDocument } from './text-document';
import { DocumentFilter } from './types';

export namespace languages {
	export const registerCodeActionsProvider = mockFunction
	export const registerCodeLensProvider = mockFunction
	export const registerCompletionItemProvider = mockFunction
	export const registerDefinitionProvider = mockFunction
	export const registerDocumentFormattingEditProvider = mockFunction
	export const registerDocumentSymbolProvider = mockFunction
	export const registerHoverProvider = mockFunction
	export const registerImplementationProvider = mockFunction
	export const registerReferenceProvider = mockFunction
	export const registerRenameProvider = mockFunction
	export const registerSignatureHelpProvider = mockFunction
	export const registerWorkspaceSymbolProvider = mockFunction
	export const setLanguageConfiguration = mockFunction

	export function createDiagnosticCollection(name: string): DiagnosticCollection {
		return new DiagnosticCollection(name)
	}

	export function match(filter: DocumentFilter, document: TextDocument): boolean {
		return true
	}

}