import normalizePerms from "../normalize/perms";
import { removeLocalDomain } from "../tools/cids";

function simplifyPerms(perms, mainDomain) {
    if (perms == null) return null;

    let simplified = [];
    for (let perm of normalizePerms(perms)) {
        simplified.push(removeLocalDomain(perm, mainDomain));
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyPerms;