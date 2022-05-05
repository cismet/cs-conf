#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import { getClientForConfig } from './tools/db';

export async function worker(options) {
    let { execute, init, silent, config } = options;
    let statements = [];
    
    statements.push(fs.readFileSync('resources/cids-init/cids-truncate.sql', 'utf8'));
    if (init) {
        statements.push(fs.readFileSync('resources/cids-init/cids-init.sql', 'utf8'));
    }

    if (execute) {
        let client;
        if (options.client) {
            client = options.client;
        } else {
            console.log(util.format("loading config %s", config));
            client = await getClientForConfig(config);

            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }
                
        console.log("truncating ...");            
        await client.query(statements.join("\n"));
        console.log(" ↳ done.");


        if (!options.client) {
            //close the connection -----------------------------------------------------------------------
            await client.end();
        }
    } else if (!silent) {
        console.log();
        console.log("#####################################################################################");
        console.log("##### showing truncate statements, NO execution (--truncate for real execution) #####");
        console.log("#####################################################################################");
        console.log();
        console.log(statements.join("\n"));
        console.log();
        console.log("#####################################################################################");
        console.log("##### showing truncate statements, NO execution (--truncate for real execution) #####");
        console.log("#####################################################################################");
    }
    return statements.join("\n");
}   

    



