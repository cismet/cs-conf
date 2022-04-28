#!/usr/bin/env ./node_modules/.bin/babel-node

import program from 'commander';
import * as csExport from './lib/export';
import * as csImport from './lib/import';
import * as csSyncDatamodel from './lib/syncDatamodel';

program.version('0.9.0').option('-c, --config <path>', 'set config path. ', './runtime.properties');

program
 	.command('import')
 	.alias('i')
 	.description('imports the meta information into the cids system')
 	.option('-f, --folder <folder>', 'the folder where the config is', 'config')
 	.option('-s, --schema <schema>', 'the schema where the cs-Tables will be', 'public')
	.option('-I, --force-import', 'the schema where the cs-Tables will be')
// 	.option('-o, --only', 'Only import the following topics')
// 	.option('-x, --skip', 'Skip the import of the following topics')
// 	.option('-C, --classes', 'The classes with their attributes and permissions')
// 	.option('-S, --structure', 'The structure information of the system')
// 	.option('-U, --usermanagement', 'The users and their groups')
 	.action(function(cmd) {
		 if (cmd.forceImport) {
			console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< IMPORT');
			console.log('... from ' + cmd.folder);
			console.log('... to ' + cmd.schema + '.cs_*');
			console.log('... for ' + cmd.parent.config);
			csImport.worker(cmd.folder, cmd.schema, cmd.parent.config);
		} else {
			console.log("!!!!!!!!!!!!!");
			console.log("!!! ERROR !!! import disabled for security reasons. Use -I to force import.");
			console.log("!!!!!!!!!!!!!");
		}
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
		console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> EXPORT');
		console.log('... to ' + cmd.folder);
		console.log('... from ' + cmd.schema + '.cs_*');
		console.log('... for ' + cmd.parent.config);
		csExport.worker(cmd.folder, cmd.schema, cmd.parent.config);
	});

program
	.command('syncDatamodel')
	.alias('s')
	.description('synchronizes the cids classes with the database')
	.option('-f, --folder <folder>', 'the folder containing the classes configuration', 'config')
	.option('-s, --schema <schema>', 'the schema where the cs-Tables are', 'public')
	.option('-p, --purge', 'activate all drop statements')
	.option('-S, --execute-sync', 'execute the queries on the db instead of juste printing them to the console')
	.action(function(cmd, options) {
		console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SYNC DATAMODEL');
 		console.log('... from ' + cmd.folder);
 		console.log('... to ' + cmd.schema + '.cs_*');
 		console.log('... for ' + cmd.parent.config);
 		console.log('... execute-sync = ' + cmd.executeSync);
 		console.log('... purge = ' + cmd.purge);
		csSyncDatamodel.worker(cmd.folder, cmd.executeSync, cmd.purge, cmd.parent.config);
	});

program
	.command('backup')
	.alias('b')
	.description('backups the meta-information (cs_*)')
	.option('-f, --folder <folder>', 'the folder to backup into', 'backups')
	.action(function(cmd, options) {
		console.log('not implemented yet')
	});

program
	.command('restore')
	.alias('r')
	.description('restore a backup (cs_*) to the database')
	.option('-f, --file <file>', 'the file to restore from', 'backups/latest.tgz')
	.action(function(cmd, options) {
		console.log('not implemented yet')
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
