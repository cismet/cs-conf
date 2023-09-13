#!/usr/bin/babel-node --

import fs from 'fs';
import util from 'util';
import program from 'commander';
import csExport from './lib/export';
import csImport from './lib/import';
import csSync from './lib/sync';
import csDiff from './lib/diff';
import csBackup from './lib/backup';
import csRestore from './lib/restore';
import csPurge from './lib/purge';
import csCreate from './lib/create';
import csTruncate from './lib/truncate';
import csPassword from './lib/password';
import csNormalize from './lib/normalize';
import csReorganize from './lib/reorganize';
import csSimplify from './lib/simplify';
import { readConfigFiles } from './lib/tools/configFiles';
import { extractDbInfo } from './lib/tools/db';
import { clean, logDebug, logErr, logVerbose } from './lib/tools/tools';
import csCheck from './lib/check';
import propertyParser from 'properties-file';
import {
    Client
} from 'pg'

global.rootSrcDir = __dirname;
global.silent = false;
global.verbose = false;
global.debug = false;

const runtimePropertiesOption = { 
	flags: '-r, --runtime-properties <filepath>', 
	description: 'the runtime.properties to load the database connection informations from',
};
const schemaOption = { 
	flags: '-s, --schema <schema>', 
	description: 'the schema where the cs-Tables are',
	default: 'public'
};

program
	.version('1.0.3')
	.option('-q, --silent', 'disables default output (error and debug message are still printed)')
	.option('-v, --verbose', 'enables verbose output')
	.option('--debug', 'enables debug output')
;

let commands = new Map();
	
program.command(' ');

commands.set('import', program.command('import'));
commands.get('import')
	.description('imports the (cs_*)meta-information from a configuration directory into a database')
	.option('-X, --import', 'activates the real import (expected for avoiding unintended importing)')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-P, --permissions-update-only', 'only update permission relevant informations such as password and configuration attributes')
	.option('-c, --config <dirpath>', 'the directory where the config is', '.')
	.option('-b, --backup-dir <dirpath>', 'the directory where the backups should be written')	
	.option('--skip-backup', 'does not create backup before import')	
	.option('--backup-prefix', 'backup file prefix', null)	
	.option('--recreate', 'purge and recreate cs_* structure before import')	
 	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csImport, {
			client: getClientForConfig(cmd.runtimeProperties),
			config: readConfigFiles(cmd.config),
			recreate: cmd.recreate, 
			execute: cmd.import,
			permissionsUpdateOnly: cmd.permissionsUpdateOnly,
			skipBackup: cmd.skipBackup,
			backupPrefix: cmd.backupPrefix,
			backupDir: cmd.backupDir,
			schema: cmd.schema, 
		}, cmd);
	});

	commands.set('updatePermissions', program.command('updatePermissions'));
	commands.get('updatePermissions')
		.description('only update permission relevant informations such as password and configuration attributes')
		.option('-X, --update', 'activates the real update (expected for avoiding unintended update)')
		.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
		.option(schemaOption.flags, schemaOption.description, schemaOption.default)
		.option('-c, --config <dirpath>', 'the directory where the config is', '.')
		.option('-b, --backup-dir <dirpath>', 'the directory where the backups should be written')	
		.option('--skip-backup', 'does not create backup before import')	
		.option('--backup-prefix', 'backup file prefix', null)	
		 .action(async (cmd) => {
			setGlobals(cmd);
			cs(csImport, {
				client: getClientForConfig(cmd.runtimeProperties),
				config: readConfigFiles(cmd.config, ["accessControl"]),
				execute: cmd.update,
				permissionsUpdateOnly: true,
				skipBackup: cmd.skipBackup,
				backupPrefix: cmd.backupPrefix,
				backupDir: cmd.backupDir,
				schema: cmd.schema, 
			}, cmd);
		});	

commands.set('backup', program.command('backup'));
commands.get('backup')
	.description('backups the (cs_*)meta-information to a file')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-d, --dir <dirpath>', 'the directory where the backups should be written')

	.option('-p, --prefix <prefix>', 'the prefix of the backup file', null)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csBackup, {
			client: getClientForConfig(cmd.runtimeProperties),
			dir: cmd.dir, 
			prefix: cmd.prefix, 
		}, cmd);
	});
 
commands.set('restore', program.command('restore'));
commands.get('restore')
	.description('restores the (cs_*)meta-information from a backup file')
	.option('-X, --restore', 'activates the real restore (expected for avoiding unintended restoring)')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-f, --file <file>', 'the backup file to restore from', null)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csRestore, {
			client: getClientForConfig(cmd.runtimeProperties),
			file: cmd.file,
			execute: cmd.restore,
		}, cmd);
	});
 
commands.set('diff', program.command('diff'));
commands.get('diff')
	.description('shows differences between (cs_*)meta-information and the given classes configuration')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the directory where the config is', '.')
	.option('-t, --target <dirpath>', 'the directory to compare the config with. if null, the current configs are exported', null)
	.option('-S, --simplify', 'compare simplified diffs')
	.option('-R, --reorganize', 'compare reorganized diffs')
	.option('-N, --normaliz', 'compare normalized diffs') //for some reason "normalize" (with "e") does not work... ?!
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csDiff, {
			config: readConfigFiles(cmd.config), 			
			client: getClientForConfig(cmd.runtimeProperties),
			mainDomain: getDomainFromConfig(cmd.runtimeProperties),
			targetDir: cmd.target, 
			simplify: cmd.simplify,
			reorganize: cmd.reorganize,
			normalize: cmd.normaliz,
			schema: cmd.schema, 
		}, cmd);
	});
 
program.command(' ');

commands.set('check', program.command('check'));
commands.get('check')
	.description('checks configuration for errors')
	.option('-c, --config <dirpath>', 'the directory containing the configuration files', '.')
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csCheck, { 
			config: readConfigFiles(cmd.config),
		}, cmd);
	});

commands.set('normalize', program.command('normalize'));
commands.get('normalize')
	.description('normalizes the configuration in a given directory')
	.option('-c, --config <dirpath>', 'the directory containing the configuration files', '.')
	.option('-t, --target <dirpath>', 'the directory to normalize the config into', null)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csNormalize, { 
			config: readConfigFiles(cmd.config),
			targetDir: cmd.target ? cmd.target : cmd.config,
		}, cmd);
	});
	
commands.set('reorganize', program.command('reorganize'));
commands.get('reorganize')
	.description('reorganizes the configuration in a given directory')
	.option('-c, --config <dirpath>', 'the directory containing the configuration files', '.')
	.option('-t, --target <dirpath>', 'the directory to reorganize the config into', null)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csReorganize, { 
			config: readConfigFiles(cmd.config),
			targetDir: cmd.target ? cmd.target : cmd.config,
		}, cmd);
	});
	 
commands.set('simplify', program.command('simplify'));
commands.get('simplify')
	.description('simplifies the configuration in a given directory')
	.option('-c, --config <dirpath>', 'the directory containing the configuration files', '.')
	.option('-t, --target <dirpath>', 'the directory to simplify the config into', null)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csSimplify, { 
			config: readConfigFiles(cmd.config),
			targetDir: cmd.target ? cmd.target : cmd.config,
		}, cmd);
	});
	 	 
program.command(' ');

commands.set('password', program.command('password'));
commands.get('password')
	.description('generates password hashes for the usermanagement')
	.option('-u, --user <user>', 'the login_name of the user')
	.option('-p, --password <password>', 'the password to set')
	.option('-s, --salt <salt>', 'the salt to use (optional, a random one is generated if not set)')
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csPassword, {
			loginName: cmd.user,
			password: cmd.password,
			salt: cmd.salt,
		}, cmd);
	});

commands.set('sync', program.command('sync'));
commands.get('sync')
	.description('synchronizes classes with the database')
	.option('-X, --sync', 'execute the queries on the db instead of juste printing them to the console (expected for avoiding unintended syncing)')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the directory containing the classes configuration')
	.option('-b, --backup-dir <dirpath>', 'the directory where the config will be written')	
	.option('-j, --sync-json <filepath>', 'the file containing the sync-configuration (sync.json)')
	.option('-P, --purge', 'activate all drop statements')
	.option('--skip-diffs', 'disables comparision with current cs_* state')
	.option('--skip-backup', 'does not create backup before import')	
	.option('--backup-prefix', 'backup file prefix', null)	
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csSync, { 
			client: getClientForConfig(cmd.runtimeProperties),
			config: cmd.config ? readConfigFiles(cmd.config) : null,
			mainDomain: getDomainFromConfig(cmd.runtimeProperties),
			execute: cmd.sync,
			purge: cmd.purge,
			skipDiffs: cmd.skipDiffs,
			schema: cmd.schema,
			syncJson: cmd.syncJson,
			skipBackup: cmd.skipBackup,
			backupPrefix: cmd.backupPrefix,
			backupDir: cmd.backupDir,
		}, cmd);
	});

program.command(' ');

commands.set('export', program.command('export'));
commands.get('export')
	.description('exports the (cs_*)meta-information of a database into a configuration directory')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the directory where the config will be written', '.')
	.option('-O, --overwrite', 'overwrite existing config')
	.option('-S, --simplify', 'simplify config')
	.option('-R, --reorganize', 'reorganize config')
	.action(async (cmd) => {		
		setGlobals(cmd);
		cs(csExport, {
			client: getClientForConfig(cmd.runtimeProperties),
			mainDomain: getDomainFromConfig(cmd.runtimeProperties),
			configDir: cmd.config, 
			schema: cmd.schema, 
			overwrite: cmd.overwrite,
			simplify: cmd.simplify,
			reorganize: cmd.reorganize,
			execute: true,
		}, cmd);
	});

commands.set('create', program.command('create'));
commands.get('create')
	.description('creates and initializes cs_tables on a given database')
	.option('-X, --create', 'activates the real create (expected for avoiding unintended creating)')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-P, --purge', 'purges before creating')
	.option('-I, --init', 'initializes some entries (for setting up a virgin database)')
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csCreate, {
			client: getClientForConfig(cmd.runtimeProperties),
			purge: cmd.purge,
			init: cmd.init,
			execute: cmd.create,
			schema: cmd.schema,
		}, cmd);
	});
	
commands.set('truncate', program.command('truncate'));
commands.get('truncate')
	.description('truncates the cs_tables on a given database')
	.option('-X, --truncate', 'activates the real truncate (expected for avoiding unintended truncating)')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-I, --init', 'initializes some entries (for setting up a virgin database)')
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csTruncate, {
			client: getClientForConfig(cmd.runtimeProperties),
			execute: cmd.truncate,
			init: cmd.init,
		}, cmd);
	});

commands.set('purge', program.command('purge'));
commands.get('purge')
	.description('purges the cs_tables on a given database')
	.option('-X, --purge', 'activates the real purge (expected for avoiding unintended purging)')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.action(async (cmd) => {
		setGlobals(cmd);
		cs(csPurge, {
			client: getClientForConfig(cmd.runtimeProperties),
			execute: cmd.purge,
		}, cmd);	
	});

program.command(' ');

let execution = program.parse(process.argv);
if (execution.args == 0 || typeof execution.args[0] === 'undefined') {
	logErr("command not found !");
	program.outputHelp()
	process.exit(1);
}

// ============================

function setGlobals(cmd) {
	global.silent = cmd.parent.silent === true;
	global.verbose = cmd.parent.verbose === true;
	global.debug = cmd.parent.debug === true;
}

async function cs(csFunction, options, cmd ) {
	let command = cmd != null ? cmd._name : null;
	let { client, execute } = options;

	logDebug(util.format("starting %s with these options:", csFunction.name));
	logDebug(clean(options));
	logDebug("-".repeat(10));

	try {		
		if (client != null) {
			if (execute === undefined || execute) {
				logVerbose(util.format("Connecting to %s ...", extractDbInfo(client)));
				await client.connect();
			} else {
				logVerbose(util.format("Connection would go to %s ...", extractDbInfo(client)));
			}
		}
		
		await csFunction(Object.assign({}, options, { main: true }));
		process.exit(0);
	} catch (e) {
		let logTemplate = "Error while execution of %s:";
		let logLength = logTemplate.length + command.length - 2;
		
		logErr("⚠".repeat(logLength));
		logErr(util.format(logTemplate, command));
		logErr();
		logErr(e);
		logErr("⚠".repeat(logLength));

		if (!global.silent) {
			if (command != null) {
				commands.get(command).outputHelp();
			} else {
				program.outputHelp();
			}
		}
		process.exit(1);
	} finally {
		await client.end();
	}
}

function getPropsFromConfig(config) {
    let propFileContent = fs.readFileSync(config, {encoding: 'utf8'});
    return propertyParser.parse(propFileContent);
}

function getClientForConfig(config) {
    logVerbose(util.format("Loading properties %s ...", config));

    let props = getPropsFromConfig(config);
    let conUrl = props["connection.url"];
    let conImportant = conUrl.split("//")[1];
    let host = conImportant.split(":")[0];
    let port = conImportant.split(":")[1].split("/")[0];
    let dbname = conImportant.split(":")[1].split("/")[1];
    let dbconfig = {
        user: props["connection.username"],
        host: host,
        database: dbname,
        password: props["connection.password"],
        port: port,
    };
    //TODO make more bullet proof
    return new Client(dbconfig);
}

function getDomainFromConfig(config) {
    let props = getPropsFromConfig(config);
    return props["serverName"];
}