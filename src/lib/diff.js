import fs from 'fs';
import util from 'util';
import csExport from './export';
import { diffString } from 'json-diff';
import { getClientForConfig } from './tools/db';
import { readConfigFiles } from './tools/configFiles';
import { normalizeConfig } from './normalize';

async function csDiff(options) {
    let { folder, target, schema, configDir } = options;

    let client;
    if (options.client) {
        client = options.client;
    } else if (!target) {
        console.log(util.format("loading config %s", configDir));
        client = getClientForConfig(configDir);

        console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
        await client.connect();
    }

    let current;
    if (target) {
        current = target;
    } else {    
        let prefix = util.format("%s[%s:%d]", client.database, client.host, client.port);
        let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
        current = util.format("diffs/%s.%s", prefix, formattedDate);

        console.log("#################");
        console.log(util.format("### exporting current config to %s for comparision.", current));
        console.log("#################");
        await csExport({ folder: current, schema: schema, configDir, client: client });
        console.log("#################");
        console.log("### export done. starting comparision.");
        console.log("#################");    
    }

    if (!options.client && client != null) {
        await client.end();
    }

    let configA = normalizeConfig(readConfigFiles(folder));
    let configB = normalizeConfig(readConfigFiles(current));

    console.log(util.format("comparing %s with %s ...", folder, current));
    let result = diffString(configA, configB, { maxElisions: 1 });
    if (result) {
        //console.log(util.format(" ↳ differences found:\n%s:", result));
    } else {
        console.log(util.format(" ↳ no differences found.", result));
    }
    console.log("#########################");
    console.log("### comparision done. ###");
    console.log("#########################");

    if (!target) {
        fs.rmSync(current, { recursive: true, force: true });
    }

    return result;
}

export default csDiff;