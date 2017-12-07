import { homedir } from "os";
import * as lsp from 'vscode-languageserver';
import * as path from 'path'

const pkginfo = require('pkginfo')(module)

export class DefaultConfig {

	readonly [key: string]: any;

	private constructor() {
		const config = module.exports.contributes.configuration.properties
		for(let k in config) {
			const key = k.replace(/^go\./, '');
			(this as any)[key] = config[k].default
		}
		(this as any)['enableCodeLens'] = {
			runtest: true,
			references: true
		} as any
		(this as any)['formatFlags'] = ''
	}

	get<T>(key: string): T {
		return this[key] as T
	}

	static readonly instance = new DefaultConfig()
}

export class CommandConfig {

	readonly map = new Map<string, string>()

	private constructor() {
		const commands = module.exports.contributes.commands
		for(let command of commands) {
			this.map.set(command.command, command.title)
		}
	}

	getTitle(commandId: string) {
		return this.map.get(commandId)
	}

	static readonly instance = new CommandConfig()
}
