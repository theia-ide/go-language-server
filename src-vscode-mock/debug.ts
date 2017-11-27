import { mockError } from './mock-error';
import { WorkspaceFolder } from './workspace'

export namespace debug {
	export function registerDebugConfigurationProvider(language: string, provider: any) { mockError() }
	export function startDebugging(WorkspaceFolder: WorkspaceFolder, config: any) { mockError() }
}