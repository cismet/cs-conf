import { copyFromTemplate,  defaultNode } from "../tools/defaultObjects";

function simplifyStructure(structure) {
    if (structure == null) return null;

    let simplified = [];
    if (structure != null) {
        for (let node of structure) {
            if (node != null) {
                let simplifiedNode = copyFromTemplate(node, defaultNode);
                if (node.children != null) {
                    simplifiedNode.children = simplifyStructure(node.children);
                }
                simplified.push(simplifiedNode);
            }
        }
    }        
    return simplified;
}

export default simplifyStructure;