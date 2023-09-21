import { extendLocalDomain } from "../tools/cids";
import { defaultConfigurationAttributes } from "../tools/defaultObjects";

function normalizeConfigurationAttributes(configurationAttributes) {
    let normalized = [];

    if (configurationAttributes) {
        for (let configurationAttribute of configurationAttributes) {
            if (configurationAttribute.key === undefined) throw "normalizeConfigurationAttributes: missing key";
            if (configurationAttribute.value != null && configurationAttribute.xmlfile != null) throw "normalizeConfigurationAttributes: value and xmlfile can't both be set";

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
            if (group != null) {
                normalized.push(extendLocalDomain(group));
            }
        }
    }

    return normalized;
}

export default normalizeConfigurationAttributes;