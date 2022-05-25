function reorganizePolicyRules(policyRules) {
    policyRules = policyRules.sort((a, b) => {
        let aPolicy = a.policy.toUpperCase();
        let bPolicy = b.policy.toUpperCase();        
        let aPermission = a.permission.toLowerCase();
        let bPermission = b.permission.toLowerCase();        
        return aPolicy.localeCompare(bPolicy) || aPermission.localeCompare(bPermission);
    });
    
    return policyRules;
}

export default reorganizePolicyRules;