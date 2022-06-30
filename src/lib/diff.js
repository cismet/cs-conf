import fs from 'fs';
import util from 'util';
import csExport from './export';
import { diffString } from 'json-diff';
import { getClientForConfig } from './tools/db';
import { readConfigFiles } from './tools/configFiles';
import { normalizeConfig } from './normalize';
import { simplifyConfig } from './simplify';
import { reorganizeConfig } from './reorganize';

async function csDiff(options) {
    let { configDir, target, schema, runtimePropertiesFile, simplify, reorganize, normalize } = options;

    let client;
    if (options.client) {
        client = options.client;
    } else if (!target) {
        console.log(util.format("loading config %s", runtimePropertiesFile));
        client = getClientForConfig(runtimePropertiesFile);

        console.log(util.format("connecting to db %s@%s:%d/%s", client.user, client.host, client.port, client.database));
        await client.connect();
    }

    let current;
    if (target) {
        current = target;
    } else {    
        let prefix = util.format("%s[%s:%d]", client.database, client.host, client.port);
        let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
        current = util.format("/tmp/diffs_%s.%s", prefix, formattedDate);

        console.log("#################");
        console.log(util.format("### exporting current config to %s for comparision.", current));
        console.log("#################");
        await csExport({ configDir: current, schema: schema, runtimePropertiesFile, client: client });
        console.log("#################");
        console.log("### export done. starting comparision.");
        console.log("#################");    
    }

    if (!options.client && client != null) {
        await client.end();
    }

    let configA = readConfigFiles(configDir);
    let configB = readConfigFiles(current);

    if (simplify) {
        console.log(util.format("simplifying config %s", configDir));
        configA = simplifyConfig(configA);
        console.log(util.format("simplifying config %s", current));
        configB = simplifyConfig(configB);
    }

    if (reorganize) {
        console.log(util.format("reorganizing config %s", configDir));
        configA = reorganizeConfig(configA);
        console.log(util.format("reorganizing config %s", current));
        configB = reorganizeConfig(configB);
    }

    if (normalize) {
        console.log(util.format("normalizing config %s", configDir));
        configA = normalizeConfig(configA);
        console.log(util.format("normalizing config %s", current));
        configB = normalizeConfig(configB);
    }

    console.log(util.format("comparing %s with %s ...", configDir, current));
    let result = diffString(configA, configB, { maxElisions: 1 });
    if (result) {
        console.log(util.format(" ↳ differences found:\n%s:", result));
    } else {
        console.log(" ↳ no differences found.");
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