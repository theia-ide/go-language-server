#!/usr/bin/env node
/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Command } from 'commander';
import { createLspConnection } from './lsp-connection';
import * as lsp from 'vscode-languageserver';

const program = new Command('go-language-server')
	.version(require('../../package.json').version)
	.option('--stdio', 'use stdio')
	.option('--node-ipc', 'use node-ipc')
	.option('--log-level <logLevel>', 'A number indicating the log level (4 = log, 3 = info, 2 = warn, 1 = error). Defaults to `2`.')
	.option('--socket <port>', 'use socket. example: --socket=5000')
	.option('--clientProcessId <pid>', 'Provide client process id to the underlying language server. example: --clientProcessId=1234')
	.parse(process.argv);

if (!(program.stdio || program.socket || program['node-ipc'])) {
	console.error('Connection type required (stdio, node-ipc, socket). Refer to --help for more details.');
	process.exit(1);
}

let logLevel = lsp.MessageType.Warning;
if (program.logLevel) {
	logLevel = parseInt(program.logLevel, 10);
	if (logLevel && (logLevel < 1 || logLevel > 4)) {
		console.error('Invalid `--log-level ' + logLevel + '`. Falling back to `info` level.');
		logLevel = lsp.MessageType.Warning;
	}
}

createLspConnection({
	goServerPath: program.goServerPath as string,
	goServerLogFile: program.goServerLogFile as string,
	goServerLogVerbosity: program.goServerLogVerbosity as string,
	showMessageLevel: logLevel as lsp.MessageType
}).listen();
