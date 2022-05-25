function preparePolicyDefaults(policyRules) {
    let csPolicyRulesEntries = [];    
    for (let r of policyRules) {
        csPolicyRulesEntries.push([r.policy,r.permission,r.default_value]);
    }
    return { csPolicyRulesEntries };
}

export default preparePolicyDefaults;