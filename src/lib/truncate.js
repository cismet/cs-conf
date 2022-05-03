#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import glob from 'glob-promise';

import importDomains from './import/domains';
import importPolicyDefaults from './import/policyDefaults';
import importUsergroups from './import/usergroups';
import importUsermanagement from './import/usermanagement';
import importConfigAttrs from './import/configAttrs';
import importClasses from './import/classes';
import importClassPermissions from './import/classPermissions';
import importStructure from './import/structure';
import * as constants from './tools/constants.js';
import { getClientForConfig } from './tools/db';

const readFile = util.promisify(fs.readFile);

export async function worker(options) {
    let { execute, silent, config } = options;
    try {
        let statements = fs.readFileSync('resources/cids-init/cids-truncate.sql', 'utf8');

        if (execute) {
            let client;
            if (options.client) {
                client = options.client;
            } else {
                console.log(util.format("* loading config %s...", config));
                client = await getClientForConfig(config);

                console.log(util.format("* connecting to db %s@%s:%d/%s...", client.user, client.host, client.port, client.database));
                await client.connect();
            }
            
            console.log("* truncating ...");            
            await client.query(statements);
            console.log("* done.");


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
            console.log(statements);
            console.log();
            console.log("#####################################################################################");
            console.log("##### showing truncate statements, NO execution (--truncate for real execution) #####");
            console.log("#####################################################################################");
        }
        return statements;
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
      }
    }   

    



