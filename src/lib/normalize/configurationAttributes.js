import { extendLocalDomain } from "../tools/cids";
import { defaultConfigurationAttributes } from "./_defaultObjects";

function normalizeConfigurationAttributes(configurationAttributes) {
    let normalized = [];

    if (configurationAttributes) {
        for (let configurationAttribute of configurationAttributes) {
            if (configurationAttribute.key === undefined) throw "missing key";
            if (configurationAttribute.value != null && configurationAttribute.xmlfile != null) throw "value and xmlfile can't both be set";

            normalized.push(Object.assign({}, defaultConfigurationAttributes, configurationAttribute));
        }    
    }

    return normalized;
}

export default normalizeConfigurationAttributes;