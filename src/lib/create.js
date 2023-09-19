import fs from 'fs';
import util from 'util';
import csPurge from './purge';
import { logInfo, logOut, logVerbose } from './tools/tools';

async function csCreate(options) {
    let { purge, init, execute, silent, main } = options
    let client = global.client;
    let schema = global.config.schema;
    
    let statements = [];

    statements.push(util.format("SET SCHEMA '%s';", schema));        
    if (purge) {
        statements.push(await csPurge({ client, execute: false, silent: false }));
    }
    statements.push(fs.readFileSync(util.format('%s/../../ddl/cids-create.sql', __dirname), 'utf8'));        
    if (init) {
        statements.push(fs.readFileSync(util.format('%s/../../ddl/cids-prepare.sql', __dirname), 'utf8'));
    }

    if (execute) {
        logOut("Creating ...");
        await client.query(statements.join("\n"));
        logVerbose(" ↳ done.");
    } else if (!silent) {
        logOut();
        logOut("###################################### ");
        logOut("##### showing restore statements ##### ");
        logOut("###################################### ");
        logOut();
        logOut(statements.join("\n"), { noSilent: main });
        logOut();
        logInfo("DRY RUN ! Nothing happend yet. Use -X to execute create.");
    }
}   

export default csCreate;