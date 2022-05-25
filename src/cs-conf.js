#!/usr/local/bin/babel-node --

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

program.version('0.9.9').option('-c, --config <path>', 'set config path. ', './runtime.properties');

program.command('import').alias('i').description('imports the meta information into the cids system')
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
 	.action(async (cmd) => {
		 let options = {
			folder: cmd.folder, 
			recreate: cmd.recreate, 
			execute: cmd.import,
			skipBackup: !cmd.backup,
			backupPrefix: cmd.backupPrefix,
			backupFolder: cmd.backupFolder,
			schema: cmd.schema, 
			configDir: cmd.parent.config,
		 }
		console.log("starting import with following options:");
		console.table(options);
		console.log();
		try {
			await csImport(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
 	});

program.command('export').alias('e').description('exports the meta information of a cids system')
	.option('-f, --folder <folder>', 'the folder where the config will be written', 'config')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.option('-O, --overwrite', 'overwrite existing config')
	.option('-R, --reorganize', 'reorganize config')
//	.option('-o, --only', 'Only export the following topics')
//	.option('-x, --skip', 'Skip the export of the following topics')
//	.option('-C, --classes', 'The classes with their attributes and permissions')
//	.option('-S, --structure', 'The structure information of the system')
//	.option('-U, --usermanagement', 'The users and their groups')
	.action(async (cmd) => {
		let options = {
			folder: cmd.folder, 
			schema: cmd.schema, 
			overwrite: cmd.overwrite,
			configDir: cmd.parent.config,
			reorganize: cmd.reorganize,
		};
		console.log("starting export with following options:");
		console.table(options);
		console.log();
		try {
			await csExport(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});

program.command('sync').alias('s').description('synchronizes the cids classes with the database')
	.option('-f, --folder <folder>', 'the folder containing the classes configuration', 'config')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.option('-p, --purge', 'activate all drop statements')
	.option('-n, --noDiffs', 'disables comparision with current cs_* state')
	.option('-S, --sync', 'execute the queries on the db instead of juste printing them to the console (expected for avoiding unintended syncing)')
	.action(async (cmd) => {		
		let options = { 
			folder: cmd.folder,
			execute: cmd.sync,
			purge: cmd.purge,
			noDiffs: cmd.noDiffs,
			schema: cmd.schema,
			configDir: cmd.parent.config,
		};
		console.log("starting sync with following options:");
		console.table(options);
		console.log();
		try {
			await csSync(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});

program.command('diff').alias('d').description('shows differences between meta-information (cs_*) and the given classes configuration')
	.option('-f, --folder <folder1>', 'the folder where the config is', 'config')
	.option('-t, --target <folder2>', 'the folder to compare the config with. if null, the current configs are exported', null)
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.action(async (cmd) => {
		let options = {
			folder: cmd.folder, 
			target: cmd.target, 
			schema: cmd.schema, 
			configDir: cmd.parent.config,
		}
		console.log("starting diff with following options:");
		console.table(options);
		console.log();
		try {
			await csDiff(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});

program.command('backup').alias('b').description('backups the meta-information (cs_*)')
	.option('-f, --folder <folder>', 'the folder to backup into', 'backups')
	.option('-p, --prefix <prefix>', 'the prefix of the backup file', null)
	.action(async (cmd) => {
		let options = {
			folder: cmd.folder, 
			prefix: cmd.prefix, 
			configDir: cmd.parent.config,
		};
		console.log("starting backup with following options:");
		console.table(options);
		console.log();
		try {
			await csBackup(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});

program.command('restore').alias('r').description('restores the meta-information (cs_*)')
	.option('-f, --file <file>', 'the backup file to restore from', null)
	.option('-R, --restore', 'activates the real restore (expected for avoiding unintended restoring)')
	.action(async (cmd) => {
		let options = {
			file: cmd.file,
			execute: cmd.restore,
			configDir: cmd.parent.config,
		};
		console.log("starting restore with following options:");
		console.table(options);
		console.log();
		try {
			await csRestore(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});

program.command('truncate').alias('t').description('truncates the cs_tables')
	.option('-T, --truncate', 'activates the real truncate (expected for avoiding unintended truncating)')
	.option('-i, --init', 'initializes some entries (for setting up a virgin database)')
	.action(async (cmd) => {
		let options = {
			execute: cmd.truncate,
			init: cmd.init,
			silent: false,
			configDir: cmd.parent.config,
		};
		console.log("starting truncate with following options:");
		console.table(options);
		console.log();
		try {
			await csTruncate(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});

program.command('purge').alias('p').description('purges the cs_tables')
	.option('-P, --purge', 'activates the real purge (expected for avoiding unintended purging)')
	.action(async (cmd) => {
		let options = {
			execute: cmd.purge,
			silent: false,
			configDir: cmd.parent.config,
		};
		console.log("starting purge with following options:");
		console.table(options);
		console.log();
		try {
			await csPurge(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});
	
program.command('create').alias('c').description('creates and initializes cs_tables')
	.option('-p, --purge', 'purges before creating')
	.option('-i, --init', 'initializes some entries (for setting up a virgin database)')
	.option('-C, --create', 'activates the real create (expected for avoiding unintended creating)')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')	
	.action(async (cmd) => {
		let options = {
			purge: cmd.purge,
			init: cmd.init,
			execute: cmd.create,
			schema: cmd.schema,
			silent: false,
			configDir: cmd.parent.config,
		};
		console.log("starting create with following options:");
		console.table(options);
		console.log();
		try {
			await csCreate(options);
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
	});
	
program.command('password').alias('pw')
	.option('-u, --user <user>', 'the login_name of the user')
	.option('-p, --password <password>', 'the password to set')
	.option('-s, --salt <salt>', 'the salt to use (optional, a random one is generated if not set)')
	.description('... description ...')
	.action(async (cmd) => {
		let options = {
			loginName: cmd.user,
			password: cmd.password,
			salt: cmd.salt,
		};
		console.log("starting password with following options:");
		console.table(options);
		console.log();
		try {
			await csPassword(options);		
			process.exit(0);
		} catch (e) {
			console.error(e); // 💩
			process.exit(1);
		}	
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
