import util from "util";
import { logDebug } from "./tools";

export function extendLocalDomain(key) {
    let parts = key.split('@');     
    let group = parts[0];
    let domain = parts.length == 1 ? 'LOCAL' : parts[1];
    return util.format("%s@%s", group, domain);
}

function removeDomain(key, name) {
    let atDomain = util.format("@%s", name);
    if (key != null && key.endsWith(atDomain)) {
        return key.substring(0, key.length - atDomain.length);
    } else {
        return key;
    }
}

export function removeLocalDomain(key, main = null) {
    return removeDomain(removeDomain(key, main), "LOCAL");
}

export function extractGroupAndDomain(key) {
    if (key != null) {
        let keyComponents = key.split('@');
        return { group: keyComponents[0], domain: keyComponents[1] };
    } else {
        return null;
    }
}

export function completeConfigurationAttributeValues(configurationAttributes, completedConfigurationAttributeValues, configurationAttributeValues, targetKey, completion = {}, aggregateConfAttrValues = false) {
    if (configurationAttributeValues) {
        for (let configurationAttributeKey of Object.keys(configurationAttributeValues)) {
            if (!configurationAttributes[configurationAttributeKey]) throw Error(util.format("configurationAttributeKey '%s' not found for '%s'.", configurationAttributeKey, completion));
            
            let configurationAttribute = configurationAttributes[configurationAttributeKey];            
            
            let configurationAttributeArray = configurationAttributeValues[configurationAttributeKey];
            if (!completedConfigurationAttributeValues[configurationAttributeKey]) {
                completedConfigurationAttributeValues[configurationAttributeKey] = [];
            }
            if (completedConfigurationAttributeValues[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                for (let configurationAttributeValue of configurationAttributeArray) {
                    completedConfigurationAttributeValues[configurationAttributeKey].push(Object.assign({}, configurationAttributeValue, completion, { type: configurationAttribute.type }));
                }
            } else if (completedConfigurationAttributeValues[configurationAttributeKey].length > 0) {
                if (completion.domain) {
                    logDebug(util.format("configurationAttribute '%s' of domain '%s' for user '%s' skipped sinced it already exists in Array", configurationAttributeKey, completion.domain, targetKey));
                } else if (completion.group) {
                    logDebug(util.format("configurationAttribute '%s' of group '%s' for user '%s' skipped sinced it already exists in Array", configurationAttributeKey, completion.group, targetKey));
                } else {
                    logDebug(util.format("configurationAttribute '%s' of target '%s' skipped sinced it already exists in Array", configurationAttributeKey, targetKey));
                }
            }
        }
    }
}
