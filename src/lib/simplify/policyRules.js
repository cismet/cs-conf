import { copyFromTemplate, defaultPolicyRule } from "../tools/defaultObjects";

function simplifyPolicyRules(policyRules) {
    if (policyRules == null) return null;

    let simplified = [];
    if (policyRules != null) {
        for (let policyRule of policyRules) {
            if (policyRule != null) {
                let simplifiedPolicyRule = copyFromTemplate(policyRule, defaultPolicyRule);                
                simplified.push(simplifiedPolicyRule);
            }
        }
    }
    return simplified;
}

export default simplifyPolicyRules;