import { preprocessUsermanagement } from "./import";
import { inspectConfigurationAttributes, inspectDomains, inspectUsergroups, inspectUsermanagement } from "./inspect";
import { normalizeConfigs } from "./normalize";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";

async function csCheck(options) {
    let configs = readConfigFiles(global.configsDir);

    if (configs == null) throw Error("config not set");

    let normalizedConfigs = normalizeConfigs(configs);
    let preprocessedUsermanagement = preprocessUsermanagement(normalizedConfigs.usermanagement, normalizedConfigs.usergroups, normalizedConfigs.configurationAttributes);

    inspectConfigurationAttributes(normalizedConfigs, preprocessedUsermanagement);    
    inspectDomains(normalizedConfigs);
    inspectUsergroups(normalizedConfigs, preprocessedUsermanagement);
    inspectUsermanagement(normalizedConfigs, preprocessedUsermanagement);

    logOut("configuration ok", { noSilent: true });
}

export default csCheck;