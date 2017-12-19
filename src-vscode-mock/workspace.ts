/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { WorkspaceEdit } from './types';
import Uri from 'vscode-uri';
import { TextDocument } from './text-document';
import { uriToStringUri } from './utils';
import { LspClient } from './lsp-client';
import { Config, DefaultConfig, FileBasedConfig } from './config';
import * as os from 'os';
import * as path from 'path';

export class WorkspaceConfiguration implements Config {

	constructor(private defaultValues: Config, private globalValues: Config, private workspaceValues: Config, private workspaceFolderValues: Config) {
		const mergedValues = { ...defaultValues, ...globalValues, ...workspaceValues, ...workspaceFolderValues };
		for (let key in mergedValues)
			(this as any)[key] = mergedValues[key];
	}

	get<T>(section: string): T | undefined {
		return this[section] as T;
	}

	inspect<T>(section: string): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T, workspaceFolderValue?: T } | undefined {
		const value: T = this.get(section);
		if (value) {
			return {
				key: section,
				defaultValue: this.defaultValues.get(section),
				globalValue: this.globalValues.get(section),
				workspaceValue: this.workspaceValues.get(section),
				workspaceFolderValue: this.workspaceFolderValues.get(section)
			};
		}
	}
}

export class WorkspacConfigurationProvider {

	private defaultConfig = DefaultConfig.instance;
	private folder2config = new Map<WorkspaceFolder, WorkspaceConfiguration>();
	private path2config = new Map<string, Config>();

	get(section: string, uri: Uri): WorkspaceConfiguration {
		if (uri) {
			const workspaceFolder = workspace.getWorkspaceFolder(uri);
			if (workspaceFolder) {
				const config = this.folder2config.get(workspaceFolder);
				if (config) 
					return config;
				const workspaceConfiguration = new WorkspaceConfiguration(
					this.defaultConfig,
					this.getConfig(os.homedir()),
					this.getConfig(workspace.rootPath),
					this.getConfig(uriToStringUri(workspaceFolder.uri)));
				this.folder2config.set(workspaceFolder, workspaceConfiguration);
				return workspaceConfiguration;
			}
		}
		return new WorkspaceConfiguration(
			this.defaultConfig,
			this.getConfig(os.homedir()),
			this.getConfig(workspace.rootPath),
			{});
	}

	public isConfigFile(uri: Uri): boolean {
		return this.path2config.get(uri.fsPath) !== undefined;
	}

	private getConfig(folder: string) {
		if (!folder)
			return {};
		const configPath = path.resolve(folder, 'go.json');
		const cached = this.path2config.get(configPath);
		if (!cached) {
			const config = new FileBasedConfig(configPath);
			this.path2config.set(configPath, config);
			return config;
		} else {
			return cached;
		}
	}
}

export class WorkspaceFolder {
	constructor(public readonly uri: Uri) { }
}

class Workspace {

	workspaceConfigurationProvider = new WorkspacConfigurationProvider();

	workspaceFolders: WorkspaceFolder[] = [];
	rootPath: string | undefined;
	lspClient: LspClient;

	getConfiguration(section?: string, resource?: Uri): WorkspaceConfiguration {
		return this.workspaceConfigurationProvider.get(section, resource);
	}

	getWorkspaceFolder(uri: Uri): WorkspaceFolder {
		const filePath = uriToStringUri(uri);
		return this.workspaceFolders.find(f => {
			const rawPath = uriToStringUri(f.uri);
			const path = (rawPath.endsWith('/')) ? rawPath : rawPath + '/';
			if (filePath.startsWith(path) ||  filePath === path) {
				return true;
			}
		});
	}

	applyEdit(edit: WorkspaceEdit): void {
		this.lspClient.applyWorkspaceEdit({ edit : edit });
	}

	async saveAll(includeUntitled?: boolean): Promise<boolean> {
		return true;
	}
}

export const workspace = new Workspace();
