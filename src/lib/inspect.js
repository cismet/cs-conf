import stringify from "json-stringify-pretty-compact";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";
import { normalizeConfigs, normalizeUser } from "./normalize";
import { extractGroupAndDomain } from "./tools/cids";
import { simplifyUser } from "./simplify";

export default async function csInspect({ userKey }) {
    let configs = readConfigFiles(global.configsDir);
    let normalized = normalizeConfigs(configs);

    if (configs == null) throw "config not set";

    if (userKey !== undefined) {
        let user = normalized.usermanagement[userKey];

        let domainKeys = new Set();
        let groupKeys = new Set();

        for (let groupKey of user.groups) {
            let groupAndDomain = extractGroupAndDomain(groupKey);
            let domainKey = groupAndDomain.domain;
            domainKeys.add(domainKey);
            groupKeys.add(groupKey);
        }

        let aggrConfigAttrs = {};
        let domainsConfigAttrs = {};
        let groupsConfigAttrs = {};
        for (let domainKey of domainKeys) {            
            let domain = normalized.domains[domainKey];
            let configurationAttributes = domain.configurationAttributes;
            domainsConfigAttrs[domainKey] = configurationAttributes;
            if (configurationAttributes) {
                for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                    let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                    if (!aggrConfigAttrs[configurationAttributeKey]) {
                        aggrConfigAttrs[configurationAttributeKey] = [];
                    }
                    aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
                }
            }
        }
        for (let groupKey of groupKeys) {
            let group = normalized.usergroups[groupKey];
            let configurationAttributes = group.configurationAttributes;
            groupsConfigAttrs[groupKey] = configurationAttributes;
            if (configurationAttributes) {
                for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                    let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                    if (!aggrConfigAttrs[configurationAttributeKey]) {
                        aggrConfigAttrs[configurationAttributeKey] = [];
                    }
                    aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
                }
            }
        }
        let configurationAttributes = user.configurationAttributes;
        if (configurationAttributes) {
            for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                if (!aggrConfigAttrs[configurationAttributeKey]) {
                    aggrConfigAttrs[configurationAttributeKey] = [];
                }
                aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
            }
        }

        let inspectedUser = Object.assign({}, user, {
            "configurationAttributes.aggregated": aggrConfigAttrs,
            "configurationAttributes.domains": domainsConfigAttrs,
            "configurationAttributes.groups": groupsConfigAttrs,
        });
        let simplifiedInspectedUser = simplifyUser(inspectedUser);

        logOut(stringify(simplifiedInspectedUser), { noSilent: true })
    }
}
