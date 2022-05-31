import * as cidstools from '../tools/cids';
import util from 'util';

function prepareConfigAttrs(domains, usergroups, usermanagement, xmlFiles) {    
    let csConfigAttrKeyEntries = []
    let csConfigAttrValueEntries = new Set();
    let csConfigAttrValues4A = []; //only action attrs
    let csConfigAttrValues4CandX = []; //normal configuration attrs and xml attributes
    
    let allConfigurationAttributes = [];
    for (let domain of domains) {
        if (domain.configurationAttributes != null) {
            for (let configurationAttribute of domain.configurationAttributes) {
                configurationAttribute.domain = domain.domainname;
                allConfigurationAttributes.push(configurationAttribute);
            } 
        }
    }

    for (let group of usergroups) {
        if (group.configurationAttributes != null) {
            let groupKey = group.key;
            let configurationAttributes = group.configurationAttributes;
            let groupAndDomain = cidstools.extractGroupAndDomain(groupKey);
            for (let configurationAttribute of configurationAttributes) {
                configurationAttribute.group = groupAndDomain.group;
                configurationAttribute.domain = groupAndDomain.domain;
                allConfigurationAttributes.push(configurationAttribute);
            }
        }
    }

    for (let user of usermanagement) {
        if (user.configurationAttributes != null) {
            let group = user.groups[0];
            let groupAndDomain = cidstools.extractGroupAndDomain(group);
            for (let configurationAttribute of user.configurationAttributes) {
                configurationAttribute.user = user.login_name;
                configurationAttribute.group = groupAndDomain.group;
                configurationAttribute.domain = groupAndDomain.domain;
                allConfigurationAttributes.push(configurationAttribute);
            }
        }
    }

    let duplicateKeyFinder = new Set();
    for (let allConfigurationAttribute of allConfigurationAttributes) {
        let type;
        if (allConfigurationAttribute.value != null) {
            type = 'C';
        } else if (allConfigurationAttribute.xmlfile != null) {
            type = 'X';
        } else {
            type = 'A';
        }
        
        let fullKey = util.format("%s.%s", allConfigurationAttribute.key, allConfigurationAttribute.keygroup);
        if (!duplicateKeyFinder.has(fullKey)) {
            csConfigAttrKeyEntries.push([
                allConfigurationAttribute.key, 
                allConfigurationAttribute.keygroup
            ]);
            duplicateKeyFinder.add(fullKey);
        }

        let value;
        if (type === 'X' || type === 'C') {
            if (type === 'X') {
                //hier xml file einladen
                value = xmlFiles.get(allConfigurationAttribute.xmlfile);
            } else {
                value = allConfigurationAttribute.value;
            }
            csConfigAttrValueEntries.add(value);
            csConfigAttrValues4CandX.push([
                allConfigurationAttribute.domain, 
                allConfigurationAttribute.group, 
                allConfigurationAttribute.user, 
                allConfigurationAttribute.key, 
                type, 
                value 
            ]);
        } else {
            csConfigAttrValues4A.push([
                allConfigurationAttribute.domain, 
                allConfigurationAttribute.group, 
                allConfigurationAttribute.user, 
                allConfigurationAttribute.key
            ]);
        }   
    }
    let csConfigAttrValueEntriesArray = [];
    csConfigAttrValueEntries.forEach( csConfigAttrValueEntry => csConfigAttrValueEntriesArray.push([csConfigAttrValueEntry]) );

    return { csConfigAttrKeyEntries, csConfigAttrValues4A, csConfigAttrValues4CandX , csConfigAttrValueEntriesArray};
}

export default prepareConfigAttrs;