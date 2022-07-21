import { normalizeConfig } from "./normalize";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";

async function csCheck(options) {
    let { configDir, main } = options;
    if (configDir == null) throw "configDir not set";

    let config = readConfigFiles(configDir);    
    normalizeConfig(config);

    logOut("configuration ok");
}

export default csCheck;