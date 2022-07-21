import normalizeStructure from "../normalize/structure";
import { copyFromTemplate,  defaultNode } from "../tools/defaultObjects";
import simplifyPerms from "./perms";

function simplifyStructure(structure, mainDomain) {
    if (structure == null) return null;

    let simplified = [];
    for (let node of normalizeStructure(structure)) {
        if (node != null) {
            simplified.push(copyFromTemplate(Object.assign({}, node, { 
                readPerms: simplifyPerms(node.readPerms, mainDomain),
                writePerms: simplifyPerms(node.writePerms, mainDomain),
                children: simplifyStructure(node.children, mainDomain),
            }), defaultNode));
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyStructure;