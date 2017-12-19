/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

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
export { MessageType } from 'vscode-languageclient/lib/protocol';
export { DiagnosticSeverity, CompletionItemKind, SymbolKind } from 'vscode-languageserver-types';
export { Disposable, Event, Emitter as EventEmitter, CancellationToken, CancellationTokenSource } from 'vscode-languageserver'