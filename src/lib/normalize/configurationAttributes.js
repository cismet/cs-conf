import { extendLocalDomain } from "../tools/cids";
import { defaultConfigurationAttributes } from "../tools/defaultObjects";

function normalizeConfigurationAttributes(configurationAttributes) {
    let normalized = [];

    if (configurationAttributes) {
        for (let configurationAttribute of configurationAttributes) {
            if (configurationAttribute.key === undefined) throw "missing key";
            if (configurationAttribute.value != null && configurationAttribute.xmlfile != null) throw "value and xmlfile can't both be set";

            normalized.push(Object.assign({}, defaultConfigurationAttributes, configurationAttribute, {
                groups: normalizeGroups(configurationAttribute.groups),
            }));
        }    
    }

    return normalized;
}

function normalizeGroups(groups) {
    let normalized = [];

    if (groups != null) {
        for (let group of groups) {
            normalized.push(extendLocalDomain(group));
        }
    }

    return normalized;
}

export default normalizeConfigurationAttributes;