#!/usr/bin/babel-node --

import { version } from '../package.json';

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
import csNormalize, { normalizeConfig } from './lib/normalize';
import csReorganize from './lib/reorganize';
import csSimplify from './lib/simplify';
import { readConfigJsonFile } from './lib/tools/configFiles';
import { clean, logDebug, logErr } from './lib/tools/tools';
import csCheck from './lib/check';
import csConfig from './lib/config';
import path from 'path';
import csInspect from './lib/inspect';

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
const targetOption = { 
	flags: '--target <dirpath>', 
	description: 'the target directory to write the config files to',
	default: null,
};

program.version(version)
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
		cs('config', csConfig, {
			file: cmd.file, 
			runtimeProperties: cmd.runtimeProperties,
			normalize: cmd.normalized !== undefined,
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
		cs('export', csExport, {
			targetDir: cmd.target,
			normalize: cmd.normalized !== undefined,
		}, cmd);
	})
);
commands.set('normalize', program.command('normalize')
	.description('normalizes the configuration in a given directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(targetOption.flags, targetOption.description, targetOption.default)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		cs('normalize', csNormalize, { 
			targetDir: cmd.target,
		}, cmd);
	})
);	
commands.set('reorganize', program.command('reorganize')
	.description('reorganizes the configuration in a given directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(targetOption.flags, targetOption.description, targetOption.default)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		cs('reorganize', csReorganize, { 
			targetDir: cmd.target,
		}, cmd);
	})
);	 
commands.set('simplify', program.command('simplify')
	.description('simplifies the configuration in a given directory')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(targetOption.flags, targetOption.description, targetOption.default)
	.option('-R, --reorganize', 'reorganize config')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		cs('simplify', csSimplify, { 
			targetDir: cmd.target,
			reorganize: cmd.reorganize !== undefined,
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
		cs('backup', csBackup, {
			dir: cmd.dir, 
			prefix: cmd.prefix, 
		}, cmd);
	})
);
program.command('\t');	
commands.set('import', program.command('import')
	.description('imports the (cs_*)meta-information from a configuration directory into a database')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-b, --backup-dir <dirpath>', 'the directory where the backups should be written')	
	.option('--skip-backup', 'does not create backup before import')	
	.option('--backup-prefix', 'backup file prefix', null)	
	.option('--recreate', 'purge and recreate cs_* structure before import')	
	.option('-X, --import', 'activates the real import (expected for avoiding unintended importing)')
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
 	.action(async (cmd) => {
		cs('import', csImport, {
			execute: cmd.import !== undefined,
			recreate: cmd.recreate !== undefined, 
			skipBackup: cmd.skipBackup !== undefined,
			backupPrefix: cmd.backupPrefix,
			backupDir: cmd.backupDir,
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
		cs('create', csCreate, {
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
		cs('truncate', csTruncate, {
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
		cs('purge', csPurge, {
			execute: cmd.purge !== undefined,
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
		cs('restore', csRestore, {
			file: cmd.file,
			execute: cmd.restore !== undefined,
		}, cmd);
	})
); 
program.command('\t');
commands.set('password', program.command('password')
	.description('changes or sets the password for an user.')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(targetOption.flags, targetOption.description, ".")
	.option('-u, --user <user>', 'the login_name of the user')
	.option('-p, --password <password>', 'the password to set')
	.option('-t, --time <timestamp>', 'the timestamp to use as last_pwd_change')
	.option('-g, --groups <groups>', 'comma separated list of groups')
	.option('-s, --salt <salt>', 'the salt to use (optional, a random one is generated if not set)')
	.option('-R, --reorganize', 'reorganize config')
	.option('-N, --normalized', 'normalize the user informations')
	.option('-A, --add', 'add a new user with the given password and groups')	
	.option('-P, --print', 'only print the new user information')	
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		cs('password', csPassword, {
			targetDir: cmd.target,
			loginName: cmd.user,
			groups: cmd.groups,
			password: cmd.password,
			salt: cmd.salt,
			time: cmd.time,
			reorganize: cmd.reorganize !== undefined,
			normalized: cmd.normalized !== undefined,
			add: cmd.add !== undefined,
			print: cmd.print !== undefined,
		}, cmd, 
		cmd.print !== undefined);
	})
);
commands.set('inspect', program.command('inspect')
	.description('inspects object(s)')
	.option(configOption.flags, configOption.description, configOption.default)
	.option('-u, --user <userKey>', 'inspects user(s)')
	.option('-g, --group <groupKey>', 'inspects group(s)')
	.option('-d, --domain <domainKey>', 'inspects domain(s)')
	.option('-A, --aggregate', 'aggregate configurationAttribute values')
	.option('-O, --output <filepath>', 'output into file')	
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		cs('inspect', csInspect, { 
			userKey: cmd.user,
			groupKey: cmd.group,
			domainKey: cmd.domain,
			fileTarget: cmd.output,
			aggregateConfAttrValues: cmd.aggregate !== undefined,
		}, cmd);
	})
);	 	 
commands.set('check', program.command('check')
	.description('checks configuration for errors')
	.option(configOption.flags, configOption.description, configOption.default)
	.option(silentOption.flags, silentOption.description, silentOption.default)
	.option(verboseOption.flags, verboseOption.description, verboseOption.default)
	.option(debugOption.flags, debugOption.description, debugOption.default)
	.action(async (cmd) => {
		cs('check', csCheck, {
		}, cmd);
	})
);

commands.set('sync', program.command('sync')
	.description('synchronizes classes with the database')
	.option(configOption.flags, configOption.description, configOption.default)
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
		cs('sync', csSync, { 
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

let execution = program.parse(process.argv);

if (execution.args == 0 || typeof execution.args[0] === 'undefined') {
	logErr("command not found !");
	program.outputHelp()
	process.exit(1);
}

// ============================

async function cs(functionName, csFunction, options, cmd, configIsOptional = false ) {
	try {		
		logDebug(util.format("starting %s with these options:", functionName));
		logDebug(clean(options));
		logDebug("-".repeat(10));

		global.silent = cmd.silent !== undefined;
		global.verbose = cmd.verbose !== undefined;
		global.debug = cmd.debug !== undefined;	
		try {
			global.config = cmd.config != null ? readConfigJsonFile(cmd.config) : null;
		} catch (e1) {
			if (configIsOptional) {
				global.config = normalizeConfig();
			} else {
				throw e1;
			}
		}
		global.configsDir = cmd.config != null ? path.dirname(path.resolve(cmd.config)) : null;

		await csFunction(Object.assign({}, options, { main: true }));
		process.exit(0);
	} catch (e) {
		let logTemplate = "Error while execution of %s:";
		let logLength = logTemplate.length + functionName.length - 2;
		
		logErr("⚠".repeat(logLength));
		logErr(util.format(logTemplate, functionName));
		logErr();
		logErr(e);
		if (e.stack && global.verbose) {
			logErr("-------");
			logErr(e.stack);
		}
		logErr("⚠".repeat(logLength));

		process.exit(1);
	} finally {
		if (global.client != null) {
			await global.client.end();
		}
	}
}