#!/usr/local/bin/babel-node --

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

const runtimePropertiesOption = { 
	flags: '-r, --runtime-properties <filepath>', 
	description: 'the runtime.properties to load the database connection informations from',
	default: './runtime.properties'
};
const schemaOption = { 
	flags: '-s, --schema <schema>', 
	description: 'the schema where the cs-Tables are',
	default: 'public'
};

program.version('0.9.9');

program.command(' ');

program.command('import').description('imports the (cs_*)meta-information from a configuration configDir into a database')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the folder where the config is', 'config')
	.option('-b, --backup-folder <dirpath>', 'backup configDir', 'backups')	
	.option('-p, --backup-prefix', 'backup file prefix', null)	
	.option('-N, --no-backup', 'does not create backup before import')	
	.option('-R, --recreate', 'purge and recreate cs_* structure before import')	
	.option('-X, --import', 'activates the real import (expected for avoiding unintended importing)')
 	.action(async (cmd) => {
		cs(csImport, {
			configDir: cmd.config, 
			recreate: cmd.recreate, 
			execute: cmd.import,
			skipBackup: !cmd.backup,
			backupPrefix: cmd.backupPrefix,
			backupFolder: cmd.backupFolder,
			schema: cmd.schema, 
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});

program.command('backup').description('backups the (cs_*)meta-information to a file')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-c, --config <dirpath>', 'the folder to backup into', 'backups')
	.option('-p, --prefix <prefix>', 'the prefix of the backup file', null)
	.action(async (cmd) => {
		cs(csBackup, {
			configDir: cmd.config, 
			prefix: cmd.prefix, 
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});
 
program.command('restore').description('restores the (cs_*)meta-information from a backup file')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-f, --file <file>', 'the backup file to restore from', null)
	.option('-X, --restore', 'activates the real restore (expected for avoiding unintended restoring)')
	.action(async (cmd) => {
		cs(csRestore, {
			file: cmd.file,
			execute: cmd.restore,
			runtimePropertiesFile: cmd.runtimeProperties,
		});	
	});
 
program.command('diff').description('shows differences between (cs_*)meta-information and the given classes configuration')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the folder where the config is', 'config')
	.option('-t, --target <dirpath>', 'the folder to compare the config with. if null, the current configs are exported', null)
	.action(async (cmd) => {
		cs(csDiff, {
			configDir: cmd.config, 
			target: cmd.target, 
			schema: cmd.schema, 
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});
 
program.command('password').description('generates password hashes for the usermanagement')
	.option('-u, --user <user>', 'the login_name of the user')
	.option('-p, --password <password>', 'the password to set')
	.option('-s, --salt <salt>', 'the salt to use (optional, a random one is generated if not set)')
	.action(async (cmd) => {
		cs(csPassword, {
			loginName: cmd.user,
			password: cmd.password,
			salt: cmd.salt,
		});		
	});
 
program.command('sync').description('synchronizes classes with the database')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the folder containing the classes configuration', 'config')
	.option('-p, --purge', 'activate all drop statements')
	.option('-n, --noDiffs', 'disables comparision with current cs_* state')
	.option('-S, --sync', 'execute the queries on the db instead of juste printing them to the console (expected for avoiding unintended syncing)')
	.action(async (cmd) => {
		cs(csSync, { 
			configDir: cmd.config,
			execute: cmd.sync,
			purge: cmd.purge,
			noDiffs: cmd.noDiffs,
			schema: cmd.schema,
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});

program.command(' ');

program.command('normalize').description('normalizes the configuration in a given configDir')
	.option('-c, --config <dirpath>', 'the folder containing the configuration files', 'config')
	.option('-t, --target <dirpath>', 'the folder to normalize the config into', null)
	.action(async (cmd) => {
		cs(csNormalize, { 
			configDir: cmd.config,
			target: cmd.target,
		});
	});

program.command('reorganize').description('reorganizes the configuration in a given configDir')
	.option('-c, --config <dirpath>', 'the folder containing the configuration files', 'config')
	.option('-t, --target <dirpath>', 'the folder to reorganize the config into', null)
	.action(async (cmd) => {
		cs(csReorganize, { 
			configDir: cmd.config,
			target: cmd.target,
		});
	});
	 
program.command('simplify').description('simplifies the configuration in a given configDir')
	.option('-c, --config <dirpath>', 'the folder containing the configuration files', 'config')
	.option('-t, --target <dirpath>', 'the folder to simplify the config into', null)
	.action(async (cmd) => {
		cs(csSimplify, { 
			configDir: cmd.config,
			target: cmd.target,
		});
	});
	 	 
program.command(' ');

program.command('export').description('exports the (cs_*)meta-information of a database into a configDir')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-c, --config <dirpath>', 'the folder where the config will be written', 'config')
	.option('-O, --overwrite', 'overwrite existing config')
	.option('-R, --reorganize', 'reorganize config')
	.action(async (cmd) => {
		cs(csExport, {
			configDir: cmd.config, 
			schema: cmd.schema, 
			overwrite: cmd.overwrite,
			runtimePropertiesFile: cmd.runtimeProperties,
			reorganize: cmd.reorganize,
		});
	});

program.command('create').description('creates and initializes cs_tables on a given database')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option(schemaOption.flags, schemaOption.description, schemaOption.default)
	.option('-p, --purge', 'purges before creating')
	.option('-i, --init', 'initializes some entries (for setting up a virgin database)')
	.option('-X, --create', 'activates the real create (expected for avoiding unintended creating)')
	.action(async (cmd) => {
		cs(csCreate, {
			purge: cmd.purge,
			init: cmd.init,
			execute: cmd.create,
			schema: cmd.schema,
			silent: false,
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});
	
program.command('truncate').description('truncates the cs_tables on a given database')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-i, --init', 'initializes some entries (for setting up a virgin database)')
	.option('-X, --truncate', 'activates the real truncate (expected for avoiding unintended truncating)')
	.action(async (cmd) => {
		cs(csTruncate, {
			execute: cmd.truncate,
			init: cmd.init,
			silent: false,
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});

program.command('purge').description('purges the cs_tables on a given database')
	.option(runtimePropertiesOption.flags, runtimePropertiesOption.description, runtimePropertiesOption.default)
	.option('-X, --purge', 'activates the real purge (expected for avoiding unintended purging)')
	.action(async (cmd) => {
		cs(csPurge, {
			execute: cmd.purge,
			silent: false,
			runtimePropertiesFile: cmd.runtimeProperties,
		});
	});

program.command(' ');

if (process.argv.slice(2).length == 0) {
	// show help
	program.outputHelp();	
	process.exit(1);
} else {
	program.parse(process.argv);
}

// ============================

async function cs(csFunction, options) {
	console.log(util.format("starting %s with these options:", csFunction.name));
	console.table(options);
	console.log();
	try {
		await csFunction(options);		
		process.exit(0);
	} catch (e) {
		console.error(e); // 💩
		process.exit(1);
	}	
}