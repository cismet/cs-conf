#!/usr/bin/env ./node_modules/.bin/babel-node

import program from 'commander';
import * as csExport from './lib/export';
import * as csImport from './lib/import';
import * as csSync from './lib/sync';
import * as csDiff from './lib/diff';
import * as csBackup from './lib/backup';
import * as csRestore from './lib/restore';
import * as csPurge from './lib/purge';
import * as csCreate from './lib/create';
import * as csTruncate from './lib/truncate';

program.version('0.9.9').option('-c, --config <path>', 'set config path. ', './runtime.properties');

program
 	.command('import')
 	.alias('i')
 	.description('imports the meta information into the cids system')
 	.option('-f, --folder <folder>', 'the folder where the config is', 'config')
 	.option('-s, --schema <schema>', 'the schema where the cs-Tables will be', 'public')
	.option('-b, --backup-folder <folder>', 'backup folder', 'backups')	
	.option('-p, --backup-prefix', 'backup file prefix', null)	
	.option('-N, --no-backup', 'does not create backup before import')	
	.option('-r, --recreate', 'purge and recreate cs_* structure before import')	
	.option('-I, --import', 'activates the real import (expected for avoiding unintended importing)')
// 	.option('-o, --only', 'Only import the following topics')
// 	.option('-x, --skip', 'Skip the import of the following topics')
// 	.option('-C, --classes', 'The classes with their attributes and permissions')
// 	.option('-S, --structure', 'The structure information of the system')
// 	.option('-U, --usermanagement', 'The users and their groups')
 	.action(function(cmd) {
		 let options = {
			folder: cmd.folder, 
			recreate: cmd.recreate, 
			execute: cmd.import,
			skipBackup: cmd.noBackup,
			backupPrefix: cmd.backupPrefix,
			backupFolder: cmd.backupFolder,
			schema: cmd.schema, 
			config: cmd.parent.config
		 }
		 console.log(cmd);
		console.log("starting import with following options:");
		console.table(options);
		console.log();
		csImport.worker(options);
 	});

program
	.command('export')
	.alias('e')
	.description('exports the meta information of a cids system')
	.option('-f, --folder <folder>', 'the folder where the config will be written', 'config')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.option('-o, --only', 'Only export the following topics')
	.option('-x, --skip', 'Skip the export of the following topics')
	.option('-C, --classes', 'The classes with their attributes and permissions')
	.option('-S, --structure', 'The structure information of the system')
	.option('-U, --usermanagement', 'The users and their groups')
	.action(function(cmd) {
		console.log("starting export with following options:");
		console.table(options);
		console.log();
		let options = {
			folder: cmd.folder, 
			schema: cmd.schema, 
			config: cmd.parent.config
		};
		csExport.worker(options);
	});

program
	.command('sync')
	.alias('s')
	.description('synchronizes the cids classes with the database')
	.option('-f, --folder <folder>', 'the folder containing the classes configuration', 'config')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.option('-p, --purge', 'activate all drop statements')
	.option('-S, --sync', 'execute the queries on the db instead of juste printing them to the console (expected for avoiding unintended syncing)')
	.action(function(cmd) {		
		let options = { 
			folder: cmd.folder, 
			execute: cmd.sync, 
			purge: cmd.purge, 
			config: cmd.parent.config 
		};
		console.log("starting sync with following options:");
		console.table(options);
		console.log();
		csSync.worker(options);
	});

program
	.command('diff')
	.alias('d')
	.description('shows differences between meta-information (cs_*) and the given classes configuration')
	.option('-f, --folder <folder1>', 'the folder where the config is', 'config')
	.option('-c, --comparison-folder <folder2>', 'the folder to compare the config with. if null, the current configs are exported', null)
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.action(function(cmd) {
		let options = {
			folder: cmd.folder, 
			comparisionFolder: cmd.comparisionFolder, 
			schema: cmd.schema, 
			config: cmd.parent.config
		}
		console.log("starting diff with following options:");
		console.table(options);
		console.log();
		csDiff.worker(options);
	});

program
	.command('backup')
	.alias('b')
	.description('backups the meta-information (cs_*)')
	.option('-f, --folder <folder>', 'the folder to backup into', 'backups')
	.option('-p, --prefix <prefix>', 'the prefix of the backup file', null)
	.action(function(cmd) {
		let options = {
			folder: cmd.folder, 
			prefix: cmd.prefix, 
			config: cmd.parent.config
		};
		console.log("starting backup with following options:");
		console.table(options);
		console.log();
		csBackup.worker(options);
	});

program
	.command('restore')
	.alias('r')
	.description('restores the meta-information (cs_*)')
	.option('-f, --file <file>', 'the backup file to restore from', null)
	.option('-R, --restore', 'activates the real restore (expected for avoiding unintended restoring)')
	.action(function(cmd) {
		let options = {
			file: cmd.file, 
			execute: cmd.restore, 
			config: cmd.parent.config
		};
		console.log("starting restore with following options:");
		console.table(options);
		console.log();
		csRestore.worker(options);
	});

program
	.command('truncate')
	.alias('t')
	.description('truncates the cs_tables')
	.option('-T, --truncate', 'activates the real truncate (expected for avoiding unintended truncating)')
	.action(function(cmd) {
		let options = {
			execute: cmd.truncate, 
			silent: false, 
			config: cmd.parent.config
		};
		console.log("starting truncate with following options:");
		console.table(options);
		console.log();
		csTruncate.worker(options);
	});

program
	.command('purge')
	.alias('p')
	.description('purges the cs_tables')
	.option('-P, --purge', 'activates the real purge (expected for avoiding unintended purging)')
	.action(function(cmd) {
		let options = {
			execute: cmd.purge, 
			silent: false, 
			config: cmd.parent.config
		};
		console.log("starting purge with following options:");
		console.table(options);
		console.log();
		csPurge.worker(options);
	});
	
program
	.command('create')
	.alias('c')
	.option('-p, --purge', 'purges before creating')
	.option('-i, --init', 'initializes some entries (for setting up a virgin database)')
	.option('-C, --create', 'activates the real create (expected for avoiding unintended creating)')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.description('creates and initializes cs_tables')
	.action(function(cmd) {
		let options = {
			purge: cmd.purge, 
			init: cmd.init, 
			execute: cmd.create, 
			schema: cmd.schema, 
			silent: false, 
			config: cmd.parent.config
		};
		console.log("starting create with following options:");
		console.table(options);
		console.log();
		csCreate.worker(options);
	});

if (process.argv.slice(2).length == 0) {
	// show help
	program.outputHelp();	
	process.exit(1);
} else {
	// Parse the commandline
	program.parse(process.argv);
}

// For development purpose
// Should be commented out

// // EXPORT
// program.parse(['node',
//     'dev-cs-conf',
//     "-c", "./runtime/runtime.properties",
//     'e',
//     '-f', 'export'
// ]);

// // IMPORT
// program.parse(['node',
//     'dev-cs-conf',
//     "-c", "./runtime/runtime.properties",
//     'i',
//     '-f', 'export',
//     '-s', '_demo',
// ]);

// Helptexts
// program.parse(['node',
//     'cs-conf',
//     'i',
//     "--help"
// ]);

// program.parse(['node',
//     'cs-conf',
//     'e',
//     "--help"
// ]);

// program.parse(['node',
//     'cs-conf',
//     "--help"
// ]);
