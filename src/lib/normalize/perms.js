import { extendLocalDomain } from "../tools/cids";

function normalizePerms(perms) {
    let normalized = [];
    
    if (perms != null) {
        for (let permission of perms) {  
            normalized.push(extendLocalDomain(permission));
        }
    }

    return normalized;
}

export default normalizePerms;