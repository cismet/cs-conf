import fs from 'fs';
import util from 'util';
import { logInfo, logOut, logVerbose } from './tools/tools';
import { initClient } from './tools/db';

async function csPurge(options) {
    let { execute, silent, main } = options;
    let statements = [];
    
    let client = await initClient(global.config.connection, execute);

    statements.push(fs.readFileSync(util.format('%s/../../ddl/cids-drop.sql', __dirname), 'utf8'));

    if (execute) {
        logOut("Purging ...");
        await client.query(statements.join("\n"));
        logVerbose(" ↳ done .");        
    } else if (!silent) {           
        logOut();
        logOut("###################################### ");
        logOut("##### showing restore statements ##### ");
        logOut("###################################### ");
        logOut();
        logOut(statements.join("\n"), { noSilent: main });
        logOut();
        logInfo("DRY RUN ! Nothing happend yet. Use -X to execute purge.");
    }
    return statements.join("\n");
}   

export default csPurge;