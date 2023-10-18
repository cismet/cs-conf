import { extractGroupAndDomain } from "../tools/cids";

function prepareUsergroups({ usergroups, configurationAttributes, additionalInfos }) {
    let csUgEntries = [];
    let prioCounter = 0;
    for (let group of usergroups) {
        let groupKey = group.key.split('@');        
        let descr = group.descr;
        let groupName = groupKey[0];
        let domainKey = groupKey[1];
        csUgEntries.push([ 
            groupName, 
            descr, 
            domainKey, 
            prioCounter,
            csUgEntries.length + 1,
        ]);
        prioCounter += 10;

        if (group.configurationAttributes) {
            let groupAndDomain = extractGroupAndDomain(group.key);
            for (let configurationAttribute of group.configurationAttributes) {
                configurationAttribute.group = groupAndDomain.group;
                configurationAttribute.domain = groupAndDomain.domain;
                configurationAttributes.push(configurationAttribute);
            }
        }

    return { csUgEntries };
}

export default prepareUsergroups;