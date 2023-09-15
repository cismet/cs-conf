import normalizeConfig from "../normalize/config";
import { copyFromTemplate, defaultConfig as defaultConfig, defaultConfigConnection as defaultConfigConnection, defaultConfigSync as defaultConfigSync } from "../tools/defaultObjects";

function simplifyConfig(config) {
    if (config == null) return null;

    let simplified = {};
    let normalized = normalizeConfig(config);
    if (normalized != null) {
        Object.assign(simplified, copyFromTemplate(normalized, defaultConfig), {
            connection: copyFromTemplate(normalized.connection, defaultConfigConnection),
            sync: copyFromTemplate(normalized.sync, defaultConfigSync),
        });
        if (Object.keys(simplified.connection).length === 0) {
            delete simplified.connection;
        }
        if (Object.keys(simplified.sync).length === 0) {
            delete simplified.sync;
        }
    }
    return Object.keys(simplified).length === 0 ? undefined : simplified;
}

export default simplifyConfig;