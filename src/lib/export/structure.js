import * as stmnts from './statements';
import { clean } from '../tools/tools.js';
import zeroFill from 'zero-fill';
import slug from 'slug';
import striptags from 'striptags';
import util from 'util';

async function exportStructure(client) {
    let {
        rows: nodesResult
    } = await client.query(stmnts.nodes);
    let {
        rows: linksResult
    } = await client.query(stmnts.links);
    let {
        rows: nodePermResult
    } = await client.query(stmnts.nodePermissions);
    let {
        rows: dynchildhelpersResult
    } = await client.query(stmnts.dynchildhelpers);
    return analyzeAndPreprocess(nodesResult, linksResult, nodePermResult, dynchildhelpersResult);
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

function analyzeAndPreprocess(nodesResult, linksResult, nodePermResult, dynchildhelpersResult) {
    let structureSqlDocuments = new Map();
    let dynchildhelpers = [];
    let helperSqlDocuments = new Map();
    let structure = [];

    let nodeReadPerms = [];
    let nodeWritePerms = [];
    for (let np of nodePermResult) {
        let ug = util.format("%s@%s", np.group, np.domain);
        let nodeReadPermissions = nodeReadPerms[np.cat_node_id];
        if (np.permission === "read") {
            if (!nodeReadPermissions) {
                nodeReadPermissions = [];
                nodeReadPerms[np.cat_node_id] = nodeReadPermissions;
            }
            nodeReadPermissions.push(ug);
        } else if (np.permission === "write") {
            let nodeWritePermissions = nodeWritePerms[np.cat_node_id];
            if (!nodeWritePermissions) {
                nodeWritePermissions = [];
                nodeWritePerms[np.cat_node_id] = nodeWritePermissions;
            }
            nodeWritePermissions.push(ug);
        }
    }


    let allNodes = new Map();
    for (let node of nodesResult) {
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
    for (let link of linksResult) {
        let toLinks = links.get(link.id_from);
        if (!toLinks) {
            toLinks = [];
            links.set(link.id_from, toLinks);
        }
        if (link.id_from !== link.id_to) { //no direct recursions
            if (toLinks.indexOf(link.id_to) === -1) {
                toLinks.push(link.id_to);
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
            console.log(util.format(" ↳ ignoring orphan node with id: %d", nodeId));
            allNodes.delete(nodeId);
        }
    }

    let sortedNodes = Array.from(allNodes.values()).sort((a, b) => { 
        let aSimple = slug(striptags(a.name)).toLowerCase() + (a.dynamic_children ? a.dynamic_children : "");
        let bSimple = slug(striptags(b.name)).toLowerCase() + (b.dynamic_children ? b.dynamic_children : "");
        return aSimple.localeCompare(bSimple);
    });
    for (let node of sortedNodes) {        
        if (node.dynamic_children) {
            let fileName = util.format("%s.%s.sql", zeroFill(3, ++structureSqlCounter), slug(striptags(node.name)).toLowerCase());
            structureSqlDocuments.set(fileName, node.dynamic_children);
            node.dynamic_children_file = fileName;        
            delete node.dynamic_children;
        }
    }

    let sortedDynchildhelpers = dynchildhelpersResult.sort((a, b) => { 
        let aSimple = slug(striptags(a.name)).toLowerCase() + a.code;
        let bSimple = slug(striptags(b.name)).toLowerCase() + b.code;
        return aSimple.localeCompare(bSimple);
    });
    for (let dynchildhelper of sortedDynchildhelpers) {
        let fileName = util.format("%s.%s.sql", zeroFill(3, ++helperSqlCounter), slug(striptags(dynchildhelper.name)).toLowerCase());
        helperSqlDocuments.set(fileName, dynchildhelper.code);
        dynchildhelper.code_file = fileName;    
        delete dynchildhelper.id;
        delete dynchildhelper.code;
        dynchildhelpers.push(dynchildhelper);
    }

    return {
        structure,
        structureSqlDocuments,
        dynchildhelpers,
        helperSqlDocuments
    };
}

export default exportStructure;