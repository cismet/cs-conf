import { normalizeConfigs } from "./normalize";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";

async function csCheck(options) {
    let configsDir = sourceDir != null ? sourceDir : global.config.configsDir;
    let configs = readConfigFiles(configsDir);

    if (configs == null) throw "config not set";

    normalizeConfigs(configs);

    logOut("configuration ok");
}

export default csCheck;