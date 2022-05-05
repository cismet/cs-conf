#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import zlib from 'zlib';
import { getClientForConfig } from './tools/db';
import * as csTruncate from './truncate';

export async function worker(options) {
    let { file, execute, config } = options;
    console.log(util.format("reading statements from %s", file));
    
    let statements = [];
    statements.push(await csTruncate.worker({ execute: false, init: true, silent: true, config: config }));
    if(file.endsWith(".gz")){
        statements.push(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
    } else {
        statements.push(fs.readFileSync(file, "utf8"));
    }

    if (execute === true) {
        let client;
        if (options.client) {
            client = options.client;
        } else {    
            console.log(util.format("loading config %s", config));
            client = await getClientForConfig(config);

            console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
            await client.connect();
        }

        console.log("executing statements ...");
        let start = new Date();
        await client.query(statements.join("\n"));
        let end = new Date();
        let seconds = (end - start) / 1000;
        console.log(util.format(" ↳ done in %f seconds.", seconds));

        if (!options.client) {
            //close the connection -----------------------------------------------------------------------
            await client.end();
        }
    } else {
        console.log();
        console.log("################################################################################### ");
        console.log("##### showing restore statements, NO execution (--restore for real execution) ##### ");
        console.log("################################################################################### ");
        console.log();
        console.log(statements.join("\n"));
        console.log();
        console.log("################################################################################### ");
        console.log("##### showing restore statements, NO execution (--restore for real execution) ##### ");
        console.log("################################################################################### ");
    }
}   

    



