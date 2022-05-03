#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import zlib from 'zlib';
import { getClientForConfig } from './tools/db';

const readFile = util.promisify(fs.readFile);

export async function worker(options) {
    let { file, execute, config } = options;
    try {
        console.log(util.format(" * reading statements from %s ...", file));
        
        let statements;
        if(file.endsWith(".gz")){
            statements = zlib.gunzipSync(fs.readFileSync(file)).toString("utf8");
        } else {
            statements = await readFile(file, "utf8");
        }

        if (execute === true) {
            let client;
            if (options.client) {
                client = options.client;
            } else {    
                console.log(util.format("* loading config %s...", config));
                client = await getClientForConfig(config);

                console.log(util.format("* connecting to db %s@%s:%d/%s...", client.user, client.host, client.port, client.database));
                await client.connect();
            }

            let start = new Date();

            console.log(" * executing statements ...");
            await client.query(statements);

            let end = new Date();

            let seconds = (end - start) / 1000;

            console.log(util.format(" * done in %f seconds !", seconds));
            
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
            console.log(statements);
            console.log();
            console.log("################################################################################### ");
            console.log("##### showing restore statements, NO execution (--restore for real execution) ##### ");
            console.log("################################################################################### ");
        }

    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
    }
}   

    



