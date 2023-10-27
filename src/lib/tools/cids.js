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

export function completeConfigAttr(aggrConfigAttrs, configurationAttributes, targetKey, completion = {}, aggregateConfAttrValues = false) {
    if (configurationAttributes) {
        for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
            let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
            if (!aggrConfigAttrs[configurationAttributeKey]) {
                aggrConfigAttrs[configurationAttributeKey] = [];
            }
            if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                for (let configurationAttribute of configurationAttributeArray) {
                    aggrConfigAttrs[configurationAttributeKey].push(Object.assign({}, configurationAttribute, completion));
                }
            } else if (aggrConfigAttrs[configurationAttributeKey].length > 0) {
                if (completion._domain) {
                    logDebug(util.format("configurationAttribute '%s' of domain '%s' for user '%s' skipped sinced it already exists in Array", configurationAttributeKey, completion._domain, targetKey));
                } else if (completion._group) {
                    logDebug(util.format("configurationAttribute '%s' of group '%s' for user '%s' skipped sinced it already exists in Array", configurationAttributeKey, completion._group, targetKey));
                } else {
                    logDebug(util.format("configurationAttribute '%s' of target '%s' skipped sinced it already exists in Array", configurationAttributeKey, targetKey));
                }
            }
        }
    }
}
