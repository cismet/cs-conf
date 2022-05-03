#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import zlib from 'zlib';
import { getClientForConfig } from './tools/db';

const writeFile = util.promisify(fs.writeFile);

export async function worker(options) {
    let { folder, prefix, config } = options;
    try {
        let client;
        if (options.client) {
            client = options.client;
        } else {
            console.log(util.format("* loading config %s...", config));
            client = await getClientForConfig(config);

            console.log(util.format("* connecting to db %s@%s:%d/%s...", client.user, client.host, client.port, client.database));
            await client.connect();
        }

		let { rows : results } = await client.query("SELECT array_to_string(array_agg(cs_dump_cs_tables), E'\n') AS statement FROM cs_dump_cs_tables(ARRAY['cs_attr', 'cs_cat_link', 'cs_cat_node', 'cs_class', 'cs_class_attr', 'cs_config_attr_jt', 'cs_config_attr_key', 'cs_config_attr_value', 'cs_domain', 'cs_dynamic_children_helper', 'cs_icon', 'cs_java_class', 'cs_policy_rule', 'cs_type', 'cs_ug', 'cs_ug_attr_perm', 'cs_ug_cat_node_perm', 'cs_ug_class_perm', 'cs_ug_membership', 'cs_usr']);");
        let statements = results[0].statement;
        //console.log(statements);

        if (!prefix) {
            prefix = util.format("%s[%s:%d]", client.database, client.host, client.port);
        }
        let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
        let fileName = util.format("%s/%s.%s.sql.gz", folder, prefix, formattedDate);
        await writeFile(fileName, zlib.gzipSync(statements), "utf8");
        
        if (!options.client) {
            //close the connection -----------------------------------------------------------------------
            await client.end();
        }

        return fileName;
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
    }
}   

    



