function preparePolicyRules(policyRules) {
    let csPolicyRulesEntries = [];    
    for (let policyRule of policyRules) {
        csPolicyRulesEntries.push([ 
            policyRule.policy, 
            policyRule.permission, 
            policyRule.default_value 
        ]);
    }
    return { csPolicyRulesEntries };
}

export default preparePolicyRules;