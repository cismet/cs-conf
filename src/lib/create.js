import fs from 'fs';
import util from 'util';
import csPurge from './purge';
import { createClient, logInfo, logOut, logVerbose } from './tools/tools';

async function csCreate(options) {
    let { purge, init, execute, silent, schema, runtimePropertiesFile, main } = options
    let statements = [];

    statements.push(util.format("SET SCHEMA '%s';", schema));        
    if (purge) {
        statements.push(await csPurge({ execute: true, silent: true, config: runtimePropertiesFile }));
    }
    statements.push(fs.readFileSync(util.format('%s/../ddl/cids-create.sql', __dirname), 'utf8'));        
    if (init) {
        statements.push(fs.readFileSync(util.format('%s/../ddl/cids-prepare.sql', __dirname), 'utf8'));
    }

    let client;
    try {
        client = (options.client != null) ? options.client : await createClient(runtimePropertiesFile, execute);

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
    } finally {
        if (options.client == null && client != null) {
            await client.end();
        }
    }
}   

export default csCreate;