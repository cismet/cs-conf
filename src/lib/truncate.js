import fs from 'fs';
import util from 'util';
import { createClient, logInfo, logOut, logVerbose } from './tools/tools';

async function csTruncate(options) {
    let { execute, init, silent, runtimePropertiesFile, main } = options;
    let statements = [];
    
    statements.push(fs.readFileSync(util.format('%s/../ddl/cids-truncate.sql', __dirname), 'utf8'));
    if (init) {
        statements.push(fs.readFileSync(util.format('%s/../ddl/cids-prepare.sql', __dirname), 'utf8'));
    }

    if (execute) {
        let client;
        try {
            client = (options.client != null) ? options.client : await createClient(runtimePropertiesFile);
                    
            logOut("Truncating ...");            
            await client.query(statements.join("\n"));
            logVerbose(" ↳ done.");
        } finally {
            if (options.client == null && client != null) {
                await client.end();
            }
        }
    } else if (!silent) {
        logOut();
        logOut("###################################### ");
        logOut("##### showing restore statements ##### ");
        logOut("###################################### ");
        logOut();
        logOut(statements.join("\n"), { noSilent: main });
        logOut();
        logInfo("DRY RUN ! Nothing happend yet. Use -X to execute truncate.");
    }
    return statements.join("\n");
}   

export default csTruncate;