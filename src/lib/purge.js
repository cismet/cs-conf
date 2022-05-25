import fs from 'fs';
import util from 'util';

import { getClientForConfig } from './tools/db';

async function csPurge(options) {
    let { execute, silent, configDir } = options;
    let statements = [];
    
    statements.push(fs.readFileSync(util.format('%s/../ddl/cids-drop.sql', __dirname), 'utf8'));

    if (execute) {
        let client;
        if (options.client) {
            client = options.client;
        } else {    
            console.log(util.format("loading config %s", configDir));
            client = getClientForConfig(configDir);
    
            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }
    
        console.log("purging ...");
        await client.query(statements.join("\n"));
        console.log(" ↳ done .");        

        if (!options.client) {
            //close the connection -----------------------------------------------------------------------
            await client.end();
        }
    } else if (!silent) {            
        console.log();
        console.log("################################################################################### ");
        console.log("##### showing purge statements, NO execution (--purge for real execution) ##### ");
        console.log("################################################################################### ");
        console.log();
        console.log(statements.join("\n"));
        console.log();
        console.log("################################################################################### ");
        console.log("##### showing purge statements, NO execution (--purge for real execution) ##### ");
        console.log("################################################################################### ");
    }
    return statements.join("\n");
}   

export default csPurge;