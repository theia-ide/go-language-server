/*
* Copyright (C) 2017 TypeFox and others.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import * as lsp from 'vscode-languageserver';
import { errorDiagnosticCollection, warningDiagnosticCollection } from '../src/goMain';
import { DiagnosticCollection } from './diagnostics';
import { window } from './window'
import { execFileSync } from 'child_process';

export interface LspClient {
    registerCapability(params: lsp.RegistrationParams): Promise<void>;
    publishDiagnostics(args: lsp.PublishDiagnosticsParams): void;
    sendTelemetryEvent(args: any): void;
    showMessage(args: lsp.ShowMessageParams): void;
    showMessageRequest(args: lsp.ShowMessageRequestParams): Promise<lsp.MessageActionItem>;
    applyWorkspaceEdit(args: lsp.ApplyWorkspaceEditParams): Promise<lsp.ApplyWorkspaceEditResponse>;
    showInformationMessage(msg: string, ...options: string[]): Promise<string | undefined>;
}

export class LspClientImpl implements LspClient {
    constructor(protected connection: lsp.IConnection) {
    }

    publishDiagnostics(args: lsp.PublishDiagnosticsParams): void {
        this.connection.sendNotification(lsp.PublishDiagnosticsNotification.type, args);
    }

    showMessage(args: lsp.ShowMessageParams): void {
        this.connection.sendNotification(lsp.ShowMessageNotification.type, args);
    }

    sendTelemetryEvent(args: any): void {
        this.connection.sendNotification(lsp.TelemetryEventNotification.type, args);
    }

    async showMessageRequest(args: lsp.ShowMessageRequestParams): Promise<lsp.MessageActionItem> {
        return this.connection.sendRequest(lsp.ShowMessageRequest.type, args);
    }

    async applyWorkspaceEdit(args: lsp.ApplyWorkspaceEditParams): Promise<lsp.ApplyWorkspaceEditResponse> {
        return this.connection.sendRequest(lsp.ApplyWorkspaceEditRequest.type, args);
    }

    async showInformationMessage(msg: string, ...options: string[]): Promise<string | undefined> {
        if (!options) {
            this.showMessage({
                message: msg,
                type: 3
            });
            return undefined;
        } else {
            const selected = await this.showMessageRequest({
                message: msg,
                type: 3,
                actions: options.map(title => { return { title } })
            });
            if (selected)
                return selected.title;
            else 
                return undefined
        }
    }

    async registerCapability(args: lsp.RegistrationParams): Promise<void> {
        return this.connection.sendRequest(lsp.RegistrationRequest.type, args);
    }
}