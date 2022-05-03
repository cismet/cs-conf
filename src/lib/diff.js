#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import { extname } from 'path';
import util from 'util';
import { diffString, diff } from 'json-diff';
import { getClientForConfig } from './tools/db';

import * as csExport from './export';

export async function worker(options) {
    let { folder, comparisionFolder, schema, config } = options;
    try {

        let current;
        if (comparisionFolder) {
            current = comparisionFolder;
        } else {
            let client;
            if (options.client) {
                client = options.client;
            } else {
                console.log(util.format("* loading config %s...", config));
                client = await getClientForConfig(config);
    
                console.log(util.format("* connecting to db %s@%s:%d/%s...", client.user, client.host, client.port, client.database));
                await client.connect();
            }
    
            let prefix = util.format("%s[%s:%d]", client.database, client.host, client.port);
            let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
            current = util.format("diffs/%s.%s", prefix, formattedDate);
            fs.mkdirSync(current);
        }
        console.log("#################");
        console.log(util.format("### exporting current config to %s for comparision ...", current));
        console.log("#################");
        await csExport.worker({ folder: current, schema: schema, config: config });

        console.log("#################");
        console.log("### export done. starting comparision.");
        console.log("#################");

        let diffsFound = 0;

        let currentFiles = {};
        for (let file of fs.readdirSync(current)) {
            if (extname(file) == ".json") {
                currentFiles[file] = true;
            }
        }

        for (let file of fs.readdirSync(folder)) {
            if (extname(file) == ".json") {
                if (currentFiles.hasOwnProperty(file)) {
                    console.log(util.format("comparing [%s] from [%s] to [%s] ...", file, folder, current));
                    let one = JSON.parse(fs.readFileSync(util.format("%s/%s", folder, file), {encoding: 'utf8'}));;
                    let other = JSON.parse(fs.readFileSync(util.format("%s/%s", current, file), {encoding: 'utf8'}));

                    let result = diffString(one, other, {maxElisions : 1});
                    if (result) {
                        console.log(util.format(" > differences found:\n%s:", result));
                        diffsFound++;
                    } else {
                        console.log(" > no differences found");
                    }

                    delete currentFiles[file];
                } else {
                    console.log(util.format("missing file [%s/%s]", current, file));
                    diffsFound++;
                }
            }
        }

        for (let file of Object.keys(currentFiles)) {
            console.log(util.format("missing file [%s/%s]", folder, file));
            diffsFound++;
        }
        console.log("#################");
        if (diffsFound > 0) {
            console.log(util.format("### comparision done. differences found in %d files.", diffsFound));
        } else {
            console.log("### comparision done. no differences found");
        }
        console.log("#################");

        if (!comparisionFolder) {
            fs.rmdirSync(current, { recursive: true });
        }

        return diffsFound;
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
    }
}   

    



