#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _export = require('./lib/export');

var csExport = _interopRequireWildcard(_export);

var _import = require('./lib/import');

var csImport = _interopRequireWildcard(_import);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.version('0.1.0').option('-c, --config <path>', 'set config path. ', './runtime.properties');

_commander2.default.command('import').alias('i').description('imports the meta information into the cids system').option('-f, --folder <folder>', 'the folder where the config is', "config").option('-s, --schema <schema>', 'the schema where the cs-Tables will be', "public").option('-o, --only', 'Only import the following topics').option('-x, --skip', 'Skip the import of the following topics').option('-C, --classes', 'The classes with their attributes and permissions').option('-S, --structure', 'The structure information of the system').option('-U, --usermanagement', 'The users and their groups').action(function (cmd) {
    console.log("import the shit");
    console.log("... in " + cmd.folder);
    console.log("... from " + cmd.schema + ".cs_*");
    csImport.worker(cmd.folder, cmd.schema);
});

_commander2.default.command('export').alias('e').description('exports the meta information of a cids system').option('-f, --folder <folder>', 'the folder where the config will be written', "config").option('-s, --schema <schema>', 'the schema where the cs-Tables are', "public").option('-o, --only', 'Only export the following topics').option('-x, --skip', 'Skip the export of the following topics').option('-C, --classes', 'The classes with their attributes and permissions').option('-S, --structure', 'The structure information of the system').option('-U, --usermanagement', 'The users and their groups').action(function (cmd) {
    console.log("export the shit");
    console.log("... in " + cmd.folder);
    console.log("... from " + cmd.schema + ".cs_*");
    console.log(cmd.only);
    console.log(cmd.parent.config);

    csExport.worker(cmd.folder, cmd.schema);
});

//program.parse(process.argv);


_commander2.default.parse(['node', 'dev-cs-conf', "-c", "./tmp/runtime.properties", 'e', '-f', 'export']);

// program.parse(['node',
//     'dev-cs-conf',
//     "-c", "./tmp/runtime.properties",
//     'i',
//     '-f', 'export',
//     '-s', '_demo',

// ]);


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
