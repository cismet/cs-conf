import { defaultConfig, defaultConfigConnection, defaultConfigSync } from "../tools/defaultObjects";

function normalizeConfig(config = {}) {
    let normalized = Object.assign({}, defaultConfig, config, {
        connection: Object.assign({}, defaultConfigConnection, config.connection),
        sync: Object.assign({}, defaultConfigSync, config.sync),
    });
    return normalized;
}

export default normalizeConfig;