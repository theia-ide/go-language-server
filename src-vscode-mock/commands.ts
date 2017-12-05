import { Thenable } from './thenable';
import { LspClient } from './lsp-client';
import * as lsp from 'vscode-languageserver';
import { generateUuid } from 'vscode-languageserver/lib/utils/uuid';

export class CommandRegistry {

	lspClient: LspClient
	commandMap = new Map<string, (...args: any[])=>any>()

	executeCommand<T>(command: string, ...rest: any[]): Thenable<T | undefined> {
		const func = this.commandMap.get(command)
		if(func)
			return func.apply(null, rest)
		else 
			throw Error('No such command \'' + command + '\'')
	}

	registerCommand(command: string, callback: (...args: any[]) => any, /*, thisArg?: any*/): any {
		this.commandMap.set(command, callback)
		const registrationParams = <lsp.RegistrationParams> {
			registrations: [
				<lsp.Registration> {
					id: generateUuid(),
					method: 'workspace/executeCommand',
					registerOptions: <lsp.ExecuteCommandOptions> {
						commands: [ command ]
					}
				}
			]
		}
		this.lspClient.registerCapability(registrationParams)
		// TODO implement deregistration
	}
}

export const commands = new CommandRegistry()
