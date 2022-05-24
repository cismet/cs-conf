import * as cidstools from '../tools/cids';
import util from 'util';

export function prepareConfigAttrs(domains, usergroups, usermanagement, xmlFiles) {    
    // cs_config_attr_key
    let csConfigAttrKeyEntries=[]
    let csConfigAttrValueEntries=new Set();
    let csConfigAttrValues4A=[]; //only action attrs
    let csConfigAttrValues4CandX=[]; //normal configuration attrs and xml attributes
    
    let allConfigurationAttributes=[];
    for (let d of domains) {
        if (d.configurationAttributes){
            for (let ca of d.configurationAttributes){
                ca.domain=d.domainname;
                allConfigurationAttributes.push(ca);
            } 
        }
    }

    for (let g of usergroups) {
        if (g.configurationAttributes){
            const {group, domain} = cidstools.extractGroupAndDomain(g.key);
            for (let ca of g.configurationAttributes){
                ca.group=group;
                ca.domain=domain;
                allConfigurationAttributes.push(ca);
            }
        }

    }

    for (let u of usermanagement) {
        if (u.configurationAttributes){
            const {group, domain} = cidstools.extractGroupAndDomain(u.groups[0]);
            for (let ca of u.configurationAttributes){
                ca.user=u.login_name;
                ca.group=group;
                ca.domain=domain;
                allConfigurationAttributes.push(ca);
            }
        }
    }

    let duplicateKeyFinder=new Set();
    for (let ca of allConfigurationAttributes){
        let type;
        if (ca.value != null) {
            type='C';
        }
        else if (ca.xmlfile != null) {
            type='X';
        }
        else {
            type='A';
        }
        
        let fullKey = util.format("%s.%s", ca.key, ca.keygroup);
        if (!duplicateKeyFinder.has(fullKey)) {
            csConfigAttrKeyEntries.push([ca.key, ca.keygroup]);
            duplicateKeyFinder.add(fullKey);
        }
        let value;
        if (type==='X' ||type==='C'){
            if (type==='X') {
                //hier xml file einladen
                value=xmlFiles.get(ca.xmlfile);

            }
            else {
                value=ca.value;
            }
            csConfigAttrValueEntries.add(value);
            csConfigAttrValues4CandX.push([ca.domain, ca.group, ca.user, ca.key, type, value ]);
        }
        else {
            csConfigAttrValues4A.push([ca.domain, ca.group, ca.user, ca.key]);
        }   
    }
    var csConfigAttrValueEntriesArray = [];
    csConfigAttrValueEntries.forEach( x => csConfigAttrValueEntriesArray.push([x]) );

    return { csConfigAttrKeyEntries, csConfigAttrValues4A, csConfigAttrValues4CandX , csConfigAttrValueEntriesArray};
}

export default prepareConfigAttrs;