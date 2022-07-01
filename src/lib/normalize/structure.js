import normalizePerms from "./perms";
import { defaultNode } from "../tools/defaultObjects";
import util from "util";

function normalizeStructure(structure) {
    let normalized = [];

    if (structure !== undefined) {
        let lastNode = null;
        for (let node of structure) {
            if (node.link == null) {
                if (node.name == null) throw util.format("normalizeStructure: missing name for node (the one after %s)", lastNode.name);
                if (node.dynamic_children_file != null && node.dynamic_children != null) throw util.format("normalizeStructure: dynamic_children and dynamic_children_file can't both be set (on node %s)", node.name);
                //if (node.children != null && (node.dynamic_children_file != null || node.dynamic_children != null)){ console.table(node);  throw "children and dynamic_children(_file) can't both be set"};
            }

            normalized.push(Object.assign({}, defaultNode, node, {
                table: node.table != null ? node.table.toLowerCase() : node.table,
                children: normalizeStructure(node.children),
                readPerms: normalizePerms(node.readPerms),
                writePerms: normalizePerms(node.writePerms),
            }));
            lastNode = node;
        }
    }

    return normalized;
}

export default normalizeStructure;