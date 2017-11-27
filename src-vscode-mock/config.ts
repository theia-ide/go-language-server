import { homedir } from "os";
import * as path from 'path'

const pkginfo = require('pkginfo')(module)

export class DefaultConfig {

	readonly [key: string]: any;

	constructor() {
		const config = module.exports.contributes.configuration.properties
		for(var k in config) {
			const key = k.replace(/^go\./, '');
			(this as any)[key] = config[k].default
		}
		if (!this['toolsGopath']) {
			(this as any)['toolsGopath'] = path.resolve(homedir(), 'go');
			(this as any)['enableCodeLens'] = {
				runtest: true,
				references: true
			}
		}
	}

	get<T>(key: string) {
		return this[key] as T
	}
}
