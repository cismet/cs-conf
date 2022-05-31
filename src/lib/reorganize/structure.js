function reorganizeStructure(structure) {
    if (structure != null) {
        for (let node of structure) {
            if (node.readPerms != null) {
                node.readPerms = node.readPerms.sort();
            }
            if (node.writePerms != null) {
                node.writePerms = node.writePerms.sort();
            }
            if (node.children != null) {
                node.children = reorganizeStructure(node.children);
            }
        }
    }

    return structure;
}

export default reorganizeStructure;