#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';

import { getClientForConfig } from './tools/db';
import * as csPurge from './purge';

export async function worker(options) {
    let { purge, init, execute, silent, schema, config } = options
    let statements = [];

    statements.push(util.format("SET SCHEMA '%s';", schema));        
    if (purge) {
        statements.push(await csPurge.worker({ execute: true, silent: true, config }));
    }
    statements.push(fs.readFileSync('build/ddl/cids-create.sql', 'utf8'));        
    if (init) {
        statements.push(fs.readFileSync('build/ddl/cids-prepare.sql', 'utf8'));
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
    
            console.log("creating ...");
            await client.query(statements.join("\n"));
            console.log(" ↳ done.");
        }

        if (!options.client) {
            //close the connection -----------------------------------------------------------------------
            await client.end();
        }
    } else if (!silent) {
        console.log();
        console.log("################################################################################# ");
        console.log("##### showing create statements, NO execution (--create for real execution) ##### ");
        console.log("################################################################################# ");
        console.log();
        console.log(statements.join("\n"));
        console.log();
        console.log("################################################################################# ");
        console.log("##### showing create statements, NO execution (--create for real execution) ##### ");
        console.log("################################################################################# ");
    }
}   

    



