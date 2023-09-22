function exportPolicyRules({ csPolicyRules }, {}) {
    let policyRules = [];
    for (let csPolicyRule of csPolicyRules) {
        policyRules.push(Object.assign({}, csPolicyRule));
    }
    return { policyRules };
}

export default exportPolicyRules;