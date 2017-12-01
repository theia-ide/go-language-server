/**
 * Mocks VSCode API or replaces it by LSP
 */

import Uri from 'vscode-uri';

export * from './commands';
export * from './debug';
export * from './diagnostics';
export * from './languages';
export * from './providers';
export * from './text-document';
export * from './text-editor';
export * from './types';
export * from './window';
export * from './workspace';

export { Uri }
export { DiagnosticSeverity, CompletionItemKind, SymbolKind } from 'vscode-languageserver-types';
export { Disposable, Event, Emitter as EventEmitter, CancellationToken, CancellationTokenSource } from 'vscode-languageserver'

