import { clean, logWarn } from '../tools/tools.js';
import zeroFill from 'zero-fill';
import slug from 'slug';
import striptags from 'striptags';
import util from 'util';

function exportStructure({ csCatNodes, csCatLinks, csUgCatNodePerms }, {}) {
    let structureSqlFiles = new Map();
    let structure = [];

    let nodeReadPerms = [];
    let nodeWritePerms = [];
    for (let csUgCatNodePerm of csUgCatNodePerms) {
        let ug = util.format("%s@%s", csUgCatNodePerm.group, csUgCatNodePerm.domain);
        let nodeReadPermissions = nodeReadPerms[csUgCatNodePerm.cat_node_id];
        if (csUgCatNodePerm.permission === "read") {
            if (!nodeReadPermissions) {
                nodeReadPermissions = [];
                nodeReadPerms[csUgCatNodePerm.cat_node_id] = nodeReadPermissions;
            }
            nodeReadPermissions.push(ug);
        } else if (csUgCatNodePerm.permission === "write") {
            let nodeWritePermissions = nodeWritePerms[csUgCatNodePerm.cat_node_id];
            if (!nodeWritePermissions) {
                nodeWritePermissions = [];
                nodeWritePerms[csUgCatNodePerm.cat_node_id] = nodeWritePermissions;
            }
            nodeWritePermissions.push(ug);
        }
    }


    let allNodes = new Map();
    for (let csCatNode of csCatNodes) {
        let node = Object.assign({}, csCatNode);
        //delete node.derive_permissions_from_class;
        if (node.sql_sort === false) {
            delete node.sql_sort;
        }
        if (node.node_type === 'N') {
            delete node.node_type;
        }
        if (!node.table && node.derive_permissions_from_class === false) {
            delete node.derive_permissions_from_class;
        }

        clean(node);
        allNodes.set(node.id, node);
        if (node.is_root === true && node.node_type !== 'C') {
            structure.push(node);
        }
        delete node.is_root;

        //Permissions
        let readPerms = nodeReadPerms[node.id];
        if (readPerms) {
            node.readPerms = readPerms;
        }
        let writePerms = nodeWritePerms[node.id];
        if (writePerms) {
            node.writePerms = writePerms;
        }

    }

    let links = new Map();
    for (let csCatLink of csCatLinks) {
        let toLinks = links.get(csCatLink.id_from);
        if (!toLinks) {
            toLinks = [];
            links.set(csCatLink.id_from, toLinks);
        }
        if (csCatLink.id_from !== csCatLink.id_to) { //no direct recursions
            if (toLinks.indexOf(csCatLink.id_to) === -1) {
                toLinks.push(csCatLink.id_to);
            }
        }
    }

    let structureSqlCounter = 0;
    let helperSqlCounter = 0;

    // visiting all nodes
    /*let nodesIdsVisited = [];
    for (let node of structure) {
        if (node) {
            nodesIdsVisited.push(... visitingNodesByChildren(node, allNodes, links));
        }
    }*/

    visitingNodesByChildren2(structure, allNodes, links, []);

    // removing all orphan nodes
    for (let node of allNodes.values()) {
        let nodeId = node.id;
        if (nodeId) {
            logWarn(util.format("ignoring orphan node with id: %d", nodeId));
            allNodes.delete(nodeId);
        }
    }

    let sortedNodes = Array.from(allNodes.values());
    for (let node of sortedNodes) {        
        if (node.dynamic_children) {
            let fileName = node.dynamic_children_filename ?? util.format("%s.%s.sql", zeroFill(3, ++structureSqlCounter), slug(striptags(node.name)).toLowerCase());
            delete node.dynamic_children_filename;
            structureSqlFiles.set(fileName, node.dynamic_children);
            node.dynamic_children_file = fileName;        
            delete node.dynamic_children;
        }
    }

    return {
        structure,
        structureSqlFiles,
    };
}


function visitingNodesByChildren(node, nodes, links) {
    let nodeId = node.id;
    if (!nodeId) { // already visited
        return [];
    }
    delete node.id;

    let childrenIdsVisited = [];
    childrenIdsVisited.push(nodeId);                    

    let children = [];
    let childrenIds = links.get(nodeId);
    if (childrenIds) {
        for (let childId of childrenIds) {
            let child = nodes.get(childId);
            if (child) {
                childrenIdsVisited.push(... visitingNodesByChildren(child, nodes, links));
                children.push(child);

            }
        }
    }
    if (children.length > 0) {
        node.children = children;
    }
    return childrenIdsVisited;
}

function visitingNodesByChildren2(nodes, allNodes, links, duplicates) {
    let childrenIdsVisited = [];
    for (let parent of nodes) {
        if (!parent) {
            continue;
        }
        let parentId = parent.id;
        childrenIdsVisited.push(parentId);                    

        let children = [];
        let childrenIds = links.get(parentId);
        delete parent.id;
        
        if (childrenIds) {
            for (let childId of childrenIds) {
                let child = allNodes.get(childId);
                if (child) {
                    if (child.id) {
                        children.push(child);
                    } else {
                        let key;
                        if (child.key) {
                            key = child.key;
                        } else {
                            duplicates.push(childId);
                            key = util.format("%s.%s", zeroFill(3, duplicates.length), slug(striptags(child.name)).toLowerCase());
                            child.key = key;
                        }
                        children.push( { link : key } );
                    }
                }
            }
        }
        if (children.length > 0) {
            childrenIdsVisited.push(... visitingNodesByChildren2(children, allNodes, links, duplicates));            
            parent.children = children;
        }
    }
    return childrenIdsVisited;
}

export default exportStructure;