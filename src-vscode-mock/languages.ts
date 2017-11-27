import { DiagnosticCollection } from './diagnostics';
import { mockError } from './mock-error'
import { TextDocument } from './text-document';
import { DocumentFilter } from './types';

export namespace languages {
	export function registerCodeActionsProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerCodeLensProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerCompletionItemProvider(filter: DocumentFilter, provider: any, ...args: string[]) { mockError() }
	export function registerDefinitionProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerDocumentFormattingEditProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerDocumentSymbolProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerHoverProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerImplementationProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerReferenceProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerRenameProvider(filter: DocumentFilter, provider: any) { mockError() }
	export function registerSignatureHelpProvider(filter: DocumentFilter, provider: any, ...args: string[]) { mockError() }
	export function registerWorkspaceSymbolProvider(provider: any) { mockError() }
	export function setLanguageConfiguration(language: string, value: any) { mockError() }

	export function createDiagnosticCollection(name: string): DiagnosticCollection {
		return new DiagnosticCollection(name)
	}

	export function match(filter: DocumentFilter, document: TextDocument): boolean {
		return true
	}

}