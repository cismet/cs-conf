import { defaultPolicyRule } from "../tools/defaultObjects";

function normalizePolicyRules(policyRules) {
    let normalized = [];
    
    if (policyRules != null) {
        for (let policyRule of policyRules) {
            if (policyRule.policy == null) throw "normalizePolicyRules: missing policy";
            if (policyRule.permission == null) throw "normalizePolicyRules: missing permission";
            if (policyRule.default_value == null) throw "normalizePolicyRules: missing default_value";
            
            normalized.push(Object.assign({}, defaultPolicyRule, policyRule));
        }
    }
    
    return normalized;
}

export default normalizePolicyRules;