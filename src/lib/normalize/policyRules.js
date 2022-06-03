import { defaultPolicyRule } from "../tools/defaultObjects";

function normalizePolicyRules(policyRules) {
    let normalized = [];
    
    if (policyRules !== undefined) {
        for (let policyRule of policyRules) {
            if (policyRule.policy == null) throw "missing policy";
            if (policyRule.permission == null) throw "missing permission";
            if (policyRule.default_value == null) throw "missing default_value";
            
            normalized.push(Object.assign({}, defaultPolicyRule, policyRule));
        }
    }
    
    return normalized;
}

export default normalizePolicyRules;