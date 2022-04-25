#!/usr/bin/env ./node_modules/.bin/babel-node

import program from 'commander';
import * as csExport from './lib/export';
import * as csImport from './lib/import';

program.version('0.9.0').option('-c, --config <path>', 'set config path. ', './runtime.properties');

program
 	.command('import')
 	.alias('i')
 	.description('imports the meta information into the cids system')
 	.option('-f, --folder <folder>', 'the folder where the config is', 'config')
 	.option('-s, --schema <schema>', 'the schema where the cs-Tables will be', 'public')
 	.option('-o, --only', 'Only import the following topics')
 	.option('-x, --skip', 'Skip the import of the following topics')
 	.option('-C, --classes', 'The classes with their attributes and permissions')
 	.option('-S, --structure', 'The structure information of the system')
 	.option('-U, --usermanagement', 'The users and their groups')
 	.action(function(cmd) {
 		console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< IMPORT');
 		console.log('... from ' + cmd.folder);
 		console.log('... to ' + cmd.schema + '.cs_*');
 		console.log('... for ' + cmd.parent.config);
 		csImport.worker(cmd.folder, cmd.schema, cmd.parent.config);
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
