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
import * as csPurge from './purge';

const readFile = util.promisify(fs.readFile);

export async function worker(options) {
    let { purge, init, execute, silent, schema, config } = options
    try {
        let statements = [];

        statements.push(util.format("CREATE SCHEMA %s IF NOT EXISTS;", schema));
        statements.push(util.format("SET SCHEMA '%s';", schema));        
        if (purge) {
            statements.push(await csPurge.worker(false, true, config));
        }
        statements.push(fs.readFileSync('resources/cids-init/cids-create.sql', 'utf8'));        
        if (init) {
            statements.push(fs.readFileSync('resources/cids-init/cids-init.sql', 'utf8'));
        }

        if (execute) {
            let client;
            if (options.client) {
                client = options.client;
            } else {    
                console.log(util.format("* loading config %s...", config));
                client = await getClientForConfig(config);
        
                console.log(util.format("* connecting to db %s@%s:%d/%s...", client.user, client.host, client.port, client.database));
                await client.connect();
        
                console.log("* creating ...");
                await client.query(statements.join("\n"));
                console.log("* done.");
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
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
      }
    }   

    



