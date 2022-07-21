import reorganizePerms from "./perms";

function reorganizeStructure(structure) {
    if (structure != null) {
        for (let node of structure) {
            if (node.readPerms != null) {
                node.readPerms = reorganizePerms(node.readPerms);
            }
            if (node.writePerms != null) {
                node.writePerms = reorganizePerms(node.writePerms);
            }
            if (node.children != null) {
                node.children = reorganizeStructure(node.children);
            }
        }
    }

    return structure;
}

export default reorganizeStructure;