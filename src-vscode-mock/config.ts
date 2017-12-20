/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { readFile, readFileSync } from 'fs-extra';
import { workspace, WorkspaceFolder } from './vscode';
import Uri from 'vscode-uri';
import { uriToStringUri } from './utils';
import { resolvePath } from '../src/util';

require('pkginfo')(module);

export type Config = {
	readonly [key: string]: any
};

export class FileBasedConfig {
	readonly [key: string]: any;

	constructor(path: string) {
		try {
			const data = readFileSync(path, 'UTF-8');
			const elements = JSON.parse(data);
			for (let key in elements) {
				(this as any)[key] = elements[key];
			}
		} catch (err) {
			console.log(err);
			// file read error
		}
	}
}

export class DefaultConfig implements Config {

	private constructor() {
		const config = module.exports.contributes.configuration.properties;
		for (let k in config) {
			const key = k.replace(/^go\./, '');
			(this as any)[key] = config[k].default;
		}
		(this as any)['enableCodeLens'] = {
			runtest: false,
			references: true
		} as any;
		(this as any)['formatFlags'] = '';
	}

	get<T>(key: string): T {
		return this[key] as T;
	}

	static readonly instance = new DefaultConfig();
}

export class CommandConfig {

	readonly map = new Map<string, string>();

	private constructor() {
		const commands = module.exports.contributes.commands;
		for (let command of commands)  {
			this.map.set(command.command, command.title);
		}
	}

	getTitle(commandId: string) {
		return this.map.get(commandId);
	}

	static readonly instance = new CommandConfig();
}
