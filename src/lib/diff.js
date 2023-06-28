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
    let { client, mainDomain, config, targetDir, simplify, reorganize, normalize, schema, main } = options;

    if (config == null) throw "'config' has to be set !";
    if (targetDir == null && client == null) throw "Either 'targetDir' or 'client' has to be set !";

    if (targetDir == null) {
        let prefix = util.format("%s_%s:%d", client.database, client.host, client.port);
        let formattedDate = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g,'');
        targetDir = util.format("/tmp/diff_%s.%s", prefix, formattedDate);
        
        await csExport({ client, mainDomain, configDir: targetDir, schema });
    }

    logVerbose("Preparing configurations for comparision ...")
    let configA = config;
    logVerbose(util.format(" ↳ loading '%s'", targetDir));
    let configB = readConfigFiles(targetDir);

    if (simplify) {
        logVerbose(util.format(" ↳ simplifying '%s'", "config"));
        configA = simplifyConfig(configA);
        logVerbose(util.format(" ↳ simplifying '%s'", targetDir));
        configB = simplifyConfig(configB);
    }

    if (reorganize) {
        logVerbose(util.format(" ↳ reorganizing '%s'", "config"));
        configA = reorganizeConfig(configA);
        logVerbose(util.format(" ↳ reorganizing '%s'", targetDir));
        configB = reorganizeConfig(configB);
    }

    if (normalize) {
        logVerbose(util.format(" ↳ normalizing '%s'", "config"));
        configA = normalizeConfig(configA);
        logVerbose(util.format(" ↳ normalizing '%s'", targetDir));
        configB = normalizeConfig(configB);
    }

    logOut(util.format("Comparing '%s' with '%s' ...", "config", targetDir));
    let result = diffString(configA, configB, { maxElisions: 1 });
    if (result) {
        logOut(result, { noSilent: main });
    } else {
        logInfo("no differences found");
    }

    if (!targetDir) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }

    return result;
}

export default csDiff;