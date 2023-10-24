import stringify from "json-stringify-pretty-compact";
import { readConfigFiles } from "./tools/configFiles";
import { logOut } from "./tools/tools";
import { normalizeConfigs, normalizeUser } from "./normalize";
import { extractGroupAndDomain } from "./tools/cids";
import { simplifyUser } from "./simplify";
import { reorganizeUser } from "./reorganize";

export default async function csInspect({ userKey, aggregateConfAttrValues = false }) {
    let configs = readConfigFiles(global.configsDir);
    let normalized = normalizeConfigs(configs);

    if (configs == null) throw "config not set";

    if (userKey !== undefined) {
        let user = normalized.usermanagement[userKey];


        let domainKeys = new Set();
        let groupKeys = new Set();
        for (let groupKey of user.groups.sort((a, b) => {
            if (a.prio === null && b.prio === null) return 0;
            if (a.prio === null) return 1;
            if (b.prio === null) return -1;
            return a.prio - b.prio;
          })) {
            let groupAndDomain = extractGroupAndDomain(groupKey);
            let domainKey = groupAndDomain.domain;
            domainKeys.add(domainKey);
            groupKeys.add(groupKey);
        }

        let aggrConfigAttrs = {};

        let configurationAttributes = user.configurationAttributes;
        if (configurationAttributes) {
            for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                if (!aggrConfigAttrs[configurationAttributeKey]) {
                    aggrConfigAttrs[configurationAttributeKey] = [];
                }
                if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                    aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
                }
            }
        }

        for (let groupKey of groupKeys) {
            let group = normalized.usergroups[groupKey];
            let configurationAttributes = group.configurationAttributes;
            if (configurationAttributes) {
                for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                    let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                    if (!aggrConfigAttrs[configurationAttributeKey]) {
                        aggrConfigAttrs[configurationAttributeKey] = [];
                    }
                    if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                        aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
                    }
                    }
            }
        }

        for (let domainKey of domainKeys) {            
            let domain = normalized.domains[domainKey];
            let configurationAttributes = domain.configurationAttributes;
            if (configurationAttributes) {
                for (let configurationAttributeKey of Object.keys(configurationAttributes)) {
                    let configurationAttributeArray = configurationAttributes[configurationAttributeKey];
                    if (!aggrConfigAttrs[configurationAttributeKey]) {
                        aggrConfigAttrs[configurationAttributeKey] = [];
                    }
                    if (aggrConfigAttrs[configurationAttributeKey].length == 0 || aggregateConfAttrValues) {
                        aggrConfigAttrs[configurationAttributeKey].push(...configurationAttributeArray);                        
                    }
                    }
            }
        }

        let inspectedUser = Object.assign({}, user, {
            configurationAttributes: aggrConfigAttrs,
        });
        let simplifiedInspectedUser = simplifyUser(reorganizeUser(inspectedUser));

        logOut(stringify(simplifiedInspectedUser), { noSilent: true })
    }
}
