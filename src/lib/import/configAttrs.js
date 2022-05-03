import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import * as cidstools from '../tools/cids';
export function prepareData(domains, usergroups, usermanagement, xmlConfigs) {    
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
        if (ca.value) {
            type='C';
        }
        else if (ca.xmlfile) {
            type='X';
        }
        else {
            type='A';
        }
        
        if (!duplicateKeyFinder.has(ca.key+"."+ca.keygroup)) {
            csConfigAttrKeyEntries.push([ca.key,ca.keygroup]);
            duplicateKeyFinder.add(ca.key+"."+ca.keygroup);
        }
        let value;
        if (type==='X' ||type==='C'){
            if (type==='X') {
                //hier xml file einladen
                value=xmlConfigs.get(ca.xmlfile);

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

const importConfigAttrs = async (client, domains, usergroups, usermanagement, xmlConfigs) => {
    const { 
        csConfigAttrKeyEntries, 
        csConfigAttrValues4A, 
        csConfigAttrValues4CandX , 
        csConfigAttrValueEntriesArray} = prepareData(domains, usergroups, usermanagement, xmlConfigs);
    console.log("* importing config attribute keys ("+csConfigAttrKeyEntries.length+")");
    await dbtools.singleRowFiller(client,stmnts.simple_cs_config_attr_key, csConfigAttrKeyEntries);

    console.log("* importing config attributes values ("+csConfigAttrValueEntriesArray.length+")");
    await dbtools.singleRowFiller(client,stmnts.simple_cs_config_attr_value, csConfigAttrValueEntriesArray);

    if (csConfigAttrValues4A.length>0){
        console.log("* importing action attributes  ("+csConfigAttrValues4A.length+")");
        await dbtools.nestedFiller(client,stmnts.complex_cs_config_attrs4A, csConfigAttrValues4A);
    }
        
     console.log("* importing config attributes  ("+csConfigAttrValues4CandX.length+")");
     await dbtools.nestedFiller(client,stmnts.complex_cs_config_attrs_C_X, csConfigAttrValues4CandX);
}

export default importConfigAttrs;