import { mockFunction } from './mock-error';
import { WorkspaceFolder } from './workspace'

export namespace debug {
	export const registerDebugConfigurationProvider = mockFunction
	export const startDebugging = mockFunction
}