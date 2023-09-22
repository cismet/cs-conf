function preparePolicyRules({ policyRules }) {
    let csPolicyRulesEntries = [];    
    for (let policyRule of policyRules) {
        csPolicyRulesEntries.push([ 
            policyRule.policy, 
            policyRule.permission, 
            policyRule.default_value,
            csPolicyRulesEntries.length + 1,
        ]);
    }
    return { csPolicyRulesEntries };
}

export default preparePolicyRules;