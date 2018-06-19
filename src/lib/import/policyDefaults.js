import * as stmnts from './statements';
import * as dbtools from '../tools/db';

export function prepareData(policyRules) {
    // cs_domain
    let csPolicyRulesEntries=[];
    
    for (let r of policyRules) {
        csPolicyRulesEntries.push([r.policy,r.permission,r.default_value]);
    }

    return { csPolicyRulesEntries };
}

const importPolicyDefaults = async (client, policyRules) => {
    const { csPolicyRulesEntries } = prepareData(policyRules);
    await dbtools.singleRowFiller(client,stmnts.simple_cs_policy_rules, csPolicyRulesEntries);
}

export default importPolicyDefaults;