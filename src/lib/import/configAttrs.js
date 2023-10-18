import util from 'util';

function prepareConfigAttrs({ xmlFiles, configurationAttributes }) {
    let csConfigAttrKeyEntries = []
    let csConfigAttrValueEntries = new Map([['true', ['true', null]]]);
    let csConfigAttrValues4A = []; //only action attrs
    let csConfigAttrValues4CandX = []; //normal configuration attrs and xml attributes
    
    if (configurationAttributes) {
        let id = 1;
        let duplicateKeyFinder = new Set();
        for (let configurationAttribute of configurationAttributes) {
            let type;
            if (configurationAttribute.value != null) {
                type = 'C';
            } else if (configurationAttribute.xmlfile != null) {
                type = 'X';
            } else {
                type = 'A';
            }

            let fullKey = util.format("%s.%s", configurationAttribute.key, configurationAttribute.keygroup);
            if (!duplicateKeyFinder.has(fullKey)) {
                csConfigAttrKeyEntries.push([
                    configurationAttribute.key, 
                    configurationAttribute.keygroup
                ]);
                duplicateKeyFinder.add(fullKey);
            }

            if (type === 'X' || type === 'C') {
                let value = (type === 'X') ? xmlFiles.get(configurationAttribute.xmlfile) : configurationAttribute.value;
                let filename = (type === 'X') ? configurationAttribute.xmlfile : null;
                csConfigAttrValueEntries.set(value, [ 
                    value, 
                    filename 
                ]);
                csConfigAttrValues4CandX.push([
                    configurationAttribute.domain, 
                    configurationAttribute.group, 
                    configurationAttribute.user, 
                    configurationAttribute.key, 
                    type, 
                    value,
                    id++, 
                ]);
            } else {
                csConfigAttrValues4A.push([
                    configurationAttribute.domain, 
                    configurationAttribute.group, 
                    configurationAttribute.user, 
                    configurationAttribute.key,
                    id++, 
                ]);
            }   
        }
    }
    let csConfigAttrValueEntriesArray = Array.from(csConfigAttrValueEntries.values());

    return { csConfigAttrKeyEntries, csConfigAttrValues4A, csConfigAttrValues4CandX , csConfigAttrValueEntriesArray};
}

export default prepareConfigAttrs;