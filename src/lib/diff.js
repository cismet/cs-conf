import fs from 'fs';
import util from 'util';
import csExport from './export';
import { diffString } from 'json-diff';
import { readConfigFiles } from './tools/configFiles';
import { normalizeConfig } from './normalize';
import { simplifyConfig } from './simplify';
import { reorganizeConfig } from './reorganize';
import { logInfo, logOut, logVerbose } from './tools/tools';

async function csDiff(options) {
    let { client, configDir, targetDir, simplify, reorganize, normalize, schema, main } = options;

    if (configDir == null) throw "'configDir' has to be set !";
    if (targetDir == null) throw "'target' has to be set !";

    let current;
    if (targetDir) {
        current = targetDir;
    } else {    
        let prefix = util.format("%s_%s:%d", client.database, client.host, client.port);
        let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
        current = util.format("/tmp/diff_%s.%s", prefix, formattedDate);

        await csExport({ client, configDir: current, schema, client });
    }

    logVerbose("Preparing configurations for comparision ...")
    logVerbose(util.format(" ↳ loading '%s'", configDir));
    let configA = readConfigFiles(configDir);
    logVerbose(util.format(" ↳ loading '%s'", current));
    let configB = readConfigFiles(current);

    if (simplify) {
        logVerbose(util.format(" ↳ simplifying '%s'", configDir));
        configA = simplifyConfig(configA);
        logVerbose(util.format(" ↳ simplifying '%s'", current));
        configB = simplifyConfig(configB);
    }

    if (reorganize) {
        logVerbose(util.format(" ↳ reorganizing '%s'", configDir));
        configA = reorganizeConfig(configA);
        logVerbose(util.format(" ↳ reorganizing '%s'", current));
        configB = reorganizeConfig(configB);
    }

    if (normalize) {
        logVerbose(util.format(" ↳ normalizing '%s'", configDir));
        configA = normalizeConfig(configA);
        logVerbose(util.format(" ↳ normalizing '%s'", current));
        configB = normalizeConfig(configB);
    }

    logOut(util.format("Comparing '%s' with '%s' ...", configDir, current));
    let result = diffString(configA, configB, { maxElisions: 1 });
    if (result) {
        logOut(result, { noSilent: main });
    } else {
        logInfo("no differences found");
    }

    if (!targetDir) {
        fs.rmSync(current, { recursive: true, force: true });
    }

    return result;
}

export default csDiff;