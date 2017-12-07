import { WorkspaceEdit } from './types';
import Uri from 'vscode-uri'
import { Event } from 'vscode-jsonrpc';
import { TextDocument } from './text-document';
import { DefaultConfig } from './config';
import { uriToStringUri } from './utils';
import { LspClient } from './lsp-client';

// TODO implement scopes default / global / workspace / workspace folder
export class WorkspaceConfiguration {

	private workspaceValues = new Map<string, any>()

	readonly [key: string]: any;

	constructor() {
		for(let k in DefaultConfig.instance) 
			(this as any)[k] = DefaultConfig.instance.get(k)
	}

	get<T>(section: string): T | undefined {
		return this[section] as T 
	}

	inspect<T>(section: string): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T, workspaceFolderValue?: T } | undefined {
		const value: T = this.workspaceValues.get(section)
		const defaultValue: T = DefaultConfig.instance.get(section)
		if (value ||  defaultValue) {
			return {
				key: section,
				defaultValue: defaultValue,
				workspaceValue: value
			}
		}
	}
}

export class WorkspaceFolder {
	constructor(public readonly uri: Uri) { }
}

class Workspace {

	workspaceFolders: WorkspaceFolder[] = []
	rootPath: string | undefined
	lspClient: LspClient

	onDidChangeTextDocument: Event<TextDocument>;
	onDidSaveTextDocument: Event<TextDocument>;

	private defaultWorkspaceConfiguration = new WorkspaceConfiguration()

	getConfiguration(section?: string, resource?: Uri): WorkspaceConfiguration {
		// TODO implement scopes default / global / workspace / workspace folder
		return this.defaultWorkspaceConfiguration
	}

	getWorkspaceFolder(uri: Uri): WorkspaceFolder {
		const filePath = uriToStringUri(uri)
		return this.workspaceFolders.find(f => {
			const rawPath = uriToStringUri(f.uri)
			const path = (rawPath.endsWith('/')) ? rawPath : rawPath + '/'
			if (filePath.startsWith(path) ||  filePath === path) {
				return true
			}
		})
	}

	applyEdit(edit: WorkspaceEdit): void {
		this.lspClient.applyWorkspaceEdit({ edit : edit })
	}

	async saveAll(includeUntitled?: boolean): Promise<boolean> {
		return true
	}
}

export const workspace = new Workspace()



