#!/usr/bin/babel-node --

import util from 'util';
import program from 'commander';
import csExport from './lib/export';
import csImport from './lib/import';
import csSync from './lib/sync';
import csBackup from './lib/backup';
import csRestore from './lib/restore';
import csPurge from './lib/purge';
import csCreate from './lib/create';
import csTruncate from './lib/truncate';
import csPassword from './lib/password';
import csNormalize from './lib/normalize';
import csReorganize from './lib/reorganize';
import csSimplify from './lib/simplify';
import { readConfigJsonFile } from './lib/tools/configFiles';
import { clean, logDebug, logErr } from './lib/tools/tools';
import csCheck from './lib/check';
import csConfig from './lib/config';

global.rootSrcDir = __dirname;
global.silent = false;
global.verbose = false;
global.debug = false;

const configOption = { 
	flags: '-c, --config <filepath>', 
	description: 'the config.json config file',
	default: 'config.json',
};
const silentOption = { 
	flags: '-q, --silent', 
	description: 'disables default output (error and debug message are still printed)',
};
const verboseOption = { 
	flags: '-v, --verbose',
	description: 'enables verbose output',
};
const debugOption = { 
	flags:'--debug',
	description: 'enables debug output',
};
const runtimePropertiesOption = { 
	flags: '-r, --runtime-properties <filepath>', 
	description: 'the runtime.properties to load the database connection informations from',
	default: 'runtime.properties',
};
const sourceOption = { 
	flags: '-s, --source <dirpath>', 
	description: 'the source directory of the config files',
	default: null,
};

program
	.version('1.1.3')
;

let commands = new Map();
program.command('\t');
commands.set('config', program.command('config').description('creates a new config file')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option("-f, --file <filepath>", "the config file", "config.json")
	.option('-N, --normalized', 'normalize the config')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
 	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csConfig, {
			file: cmd.file, 
			runtimeProperties: cmd.runtimeProperties,
			normalize: cmd.normalized !== undefined,
		}, cmd);
	})
);
program.command('\t');	
commands.set('import', program.command('import')
	.description('imports the (cs_*)meta-information from a configuration directory into a database')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(sourceOption.flags, sourceOption.description, sourceOption.default)
	.option('-b, --backup-dir <dirpath>', 'the directory where the backups should be written')	
	.option('--skip-backup', 'does not create backup before import')	
	.option('--backup-prefix', 'backup file prefix', null)	
	.option('--recreate', 'purge and recreate cs_* structure before import')	
	.option('-X, --import', 'activates the real import (expected for avoiding unintended importing)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
 	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csImport, {
			execute: cmd.import !== undefined,
			recreate: cmd.recreate !== undefined, 
			skipBackup: cmd.skipBackup !== undefined,
			sourceDir: cmd.source,
			backupPrefix: cmd.backupPrefix,
			backupDir: cmd.backupDir,
		}, cmd);
	})
);
commands.set('backup', program.command('backup')
	.description('backups the (cs_*)meta-information to a file')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-d, --dir <dirpath>', 'the directory where the backups should be written')
	.option('-p, --prefix <prefix>', 'the prefix of the backup file', null)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csBackup, {
			dir: cmd.dir, 
			prefix: cmd.prefix, 
		}, cmd);
	})
);
commands.set('restore', program.command('restore')
	.description('restores the (cs_*)meta-information from a backup file')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-f, --file <file>', 'the backup file to restore from', null)
	.option('-X, --restore', 'activates the real restore (expected for avoiding unintended restoring)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csRestore, {
			file: cmd.file,
			execute: cmd.restore !== undefined,
		}, cmd);
	})
); 
program.command('\t');
commands.set('check', program.command('check')
	.description('checks configuration for errors')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.option(sourceOption.flags, sourceOption.description, sourceOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csCheck, {
			sourceDir: cmd.source
		}, cmd);
	})
);
commands.set('normalize', program.command('normalize')
	.description('normalizes the configuration in a given directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-t, --target <dirpath>', 'the target directory to normalize the config into', null)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.option(sourceOption.flags, sourceOption.description, sourceOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csNormalize, { 
			sourceDir: cmd.source,
			targetDir: cmd.target,
		}, cmd);
	})
);	
commands.set('reorganize', program.command('reorganize')
	.description('reorganizes the configuration in a given directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-t, --target <dirpath>', 'the target directory to reorganize the config into', null)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.option(sourceOption.flags, sourceOption.description, sourceOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csReorganize, { 
			sourceDir: cmd.source,
			targetDir: cmd.target,
		}, cmd);
	})
);	 
commands.set('simplify', program.command('simplify')
	.description('simplifies the configuration in a given directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-t, --target <dirpath>', 'the target directory to simplify the config into', null)
	.option('-R, --reorganize', 'reorganize config')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.option(sourceOption.flags, sourceOption.description, sourceOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csSimplify, { 
			sourceDir: cmd.source,
			targetDir: cmd.target,
			reorganize: cmd.reorganize !== undefined,
		}, cmd);
	})
);	 	 
program.command('\t');
commands.set('password', program.command('password')
	.description('generates password hashes for the usermanagement')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-u, --user <user>', 'the login_name of the user')
	.option('-p, --password <password>', 'the password to set')
	.option('-s, --salt <salt>', 'the salt to use (optional, a random one is generated if not set)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csPassword, {
			loginName: cmd.user,
			password: cmd.password,
			salt: cmd.salt,
		}, cmd);
	})
);
commands.set('sync', program.command('sync')
	.description('synchronizes classes with the database')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(sourceOption.flags, sourceOption.description, sourceOption.default)
	.option('-t, --target <dirpath>', 'the target directory to export the config into', null)
	.option('-C, --from-config', 'use local config directory instead of exporting the configuration from the database')
	.option('-P, --purge', 'activate all drop statements')
	.option('-S, --output-sql', 'outputs SQL statements')
	.option('-D, --output-drop', 'outputs drop statements')
	.option('-I, --output-ignore', 'outputs ignore snippets')
	.option('-X, --sync', 'execute the queries on the db instead of juste printing them to the console (expected for avoiding unintended syncing)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csSync, { 
			sourceDir: cmd.source,
			targetDir: cmd.target,
			noExport: cmd.fromConfig !== undefined,
			purge: cmd.purge !== undefined,
			outputSql: cmd.outputSql !== undefined,
			outputDrop: cmd.outputDrop !== undefined,
			outputIgnore: cmd.outputIgnore !== undefined,
			execute: cmd.sync !== undefined,
		}, cmd);
	})
);
program.command('\t');
commands.set('export', program.command('export')
	.description('exports the (cs_*)meta-information of a database into a configuration directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-t, --target <dirpath>', 'the target directory to export the config into', null)
	.option('-N, --normalized', 'normalized config')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {		
		setGlobals(cmd);
		cs(csExport, {
			targetDir: cmd.target,
			normalize: cmd.normalized !== undefined,
		}, cmd);
	})
);
commands.set('create', program.command('create')
	.description('creates and initializes cs_tables on a given database')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-P, --purge', 'purges before creating')
	.option('-I, --init', 'initializes some entries (for setting up a virgin database)')
	.option('-X, --create', 'activates the real create (expected for avoiding unintended creating)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csCreate, {
			purge: cmd.purge !== undefined,
			init: cmd.init !== undefined,
			execute: cmd.create !== undefined,
		}, cmd);
	})
);	
commands.set('truncate', program.command('truncate')
	.description('truncates the cs_tables on a given database')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-I, --init', 'initializes some entries (for setting up a virgin database)')
	.option('-X, --truncate', 'activates the real truncate (expected for avoiding unintended truncating)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csTruncate, {
			execute: cmd.truncate !== undefined,
			init: cmd.init !== undefined,
		}, cmd);
	})
);
commands.set('purge', program.command('purge')
	.description('purges the cs_tables on a given database')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-X, --purge', 'activates the real purge (expected for avoiding unintended purging)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csPurge, {
			execute: cmd.purge !== undefined,
		}, cmd);	
	})
);
program.command('\t');

let execution = program.parse(process.argv);

if (execution.args == 0 || typeof execution.args[0] === 'undefined') {
	logErr("command not found !");
	program.outputHelp()
	process.exit(1);
}

// ============================

function setGlobals(cmd) {
	global.silent = cmd.silent !== undefined;
	global.verbose = cmd.verbose !== undefined;
	global.debug = cmd.debug !== undefined;	
	global.config = readConfigJsonFile(cmd.config)	
}

async function cs(csFunction, options, cmd ) {
	let functionName = csFunction.name;
	logDebug(util.format("starting %s with these options:", csFunction.name));
	logDebug(clean(options));
	logDebug("-".repeat(10));

	try {		
		await csFunction(Object.assign({}, options, { main: true }));
		process.exit(0);
	} catch (e) {
		let logTemplate = "Error while execution of %s:";
		let logLength = logTemplate.length + functionName.length - 2;
		
		logErr("⚠".repeat(logLength));
		logErr(util.format(logTemplate, functionName));
		logErr();
		logErr(e);
		if (e.stack) {
			logErr("-------");
			logErr(e.stack);
		}
		logErr("⚠".repeat(logLength));

		if (!global.silent) {
			if (functionName != null) {
				commands.get(functionName).outputHelp();
			} else {
				program.outputHelp();
			}
		}
		process.exit(1);
	} finally {
		if (global.client != null) {
			await global.client.end();
		}
	}
}