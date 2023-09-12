import fs from 'fs';
import util from 'util';
import zlib from 'zlib';
import { extractDbInfo } from './tools/db';
import { logInfo, logOut, logVerbose } from './tools/tools';

async function csBackup(options) {
    let { client, dir, prefix } = options;
    
    logOut(util.format("Creating backup of '%s'...", extractDbInfo(client)));
    let start = new Date();
    await client.query(fs.readFileSync(util.format('%s/../../ddl/cids-backup.sql', __dirname), 'utf8'));            
    let { rows : results } = await client.query("SELECT array_to_string(array_agg(cs_dump_cs_tables), E'\n') AS queries FROM cs_dump_cs_tables(ARRAY['url', 'url_base', 'cs_attr', 'cs_cat_link', 'cs_cat_node', 'cs_class', 'cs_class_attr', 'cs_config_attr_jt', 'cs_config_attr_key', 'cs_config_attr_value', 'cs_domain', 'cs_dynamic_children_helper', 'cs_icon', 'cs_java_class', 'cs_policy_rule', 'cs_type', 'cs_ug', 'cs_ug_attr_perm', 'cs_ug_cat_node_perm', 'cs_ug_class_perm', 'cs_ug_membership', 'cs_usr']);");
    let end = new Date();
    let seconds = (end - start) / 1000;
    logVerbose(util.format(" ↳ done in %f seconds", seconds));

    let queries = results[0].queries;

    if (!prefix) {
        prefix = util.format("%s_%s:%d", client.database, client.host, client.port);
    }
    let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
    let fileName = util.format("%s/%s.%s.sql.gz", dir, prefix, formattedDate);

    logInfo(util.format("Writing backup to %s", fileName));
    fs.writeFileSync(fileName, zlib.gzipSync(queries), "utf8");
    
    return fileName;
}   

export default csBackup;