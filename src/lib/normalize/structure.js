import normalizePerms from "./perms";
import { defaultNode } from "../tools/defaultObjects";

function normalizeStructure(structure) {
    let normalized = [];

    if (structure !== undefined) {
        for (let node of structure) {
            if (node.link == null) {
                if (node.name == null) throw "missing name for node";
                if (node.dynamic_children_file != null && node.dynamic_children != null) throw "dynamic_children and dynamic_children_file can't both be set";
                //if (node.children != null && (node.dynamic_children_file != null || node.dynamic_children != null)){ console.table(node);  throw "children and dynamic_children(_file) can't both be set"};
            }

            normalized.push(Object.assign({}, defaultNode, node, {
                children: normalizeStructure(node.children),
                readPerms: normalizePerms(node.readPerms),
                writePerms: normalizePerms(node.writePerms),
            }));
        }
    }

    return normalized;
}

export default normalizeStructure;