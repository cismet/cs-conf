import normalizePolicyRules from "../normalize/policyRules";
import { copyFromTemplate, defaultPolicyRule } from "../tools/defaultObjects";

function simplifyPolicyRules(policyRules) {
    if (policyRules == null) return null;

    let simplified = [];
    for (let policyRule of normalizePolicyRules(policyRules)) {
        if (policyRule != null) {
            simplified.push(copyFromTemplate(policyRule, defaultPolicyRule));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyPolicyRules;