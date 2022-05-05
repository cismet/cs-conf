import * as stmnts from './statements';
import clean from '../tools/deleteNullProperties.js';
import zeroFill from 'zero-fill';
import slug from 'slug';
import striptags from 'striptags';

const exportStructure = async (client) => {
    const {
        rows: nodesResult
    } = await client.query(stmnts.nodes);
    const {
        rows: linksResult
    } = await client.query(stmnts.links);
    const {
        rows: nodePermResult
    } = await client.query(stmnts.nodePermissions);
    const {
        rows: dynchildhelpersResult
    } = await client.query(stmnts.dynchildhelpers);
    return analyzeAndPreprocess(nodesResult, linksResult, nodePermResult, dynchildhelpersResult);
}

export function analyzeAndPreprocess(nodesResult, linksResult, nodePermResult, dynchildhelpersResult) {
    let nodeReadPerms = new Map();
    let nodeWritePerms = new Map();
    for (let np of nodePermResult) {
        let ug = np.group + "@" + np.domain;
        let nodeReadPermissions = nodeReadPerms.get(np.cat_node_id);
        if (np.permission === "read") {
            if (!nodeReadPermissions) {
                nodeReadPermissions = [];
                nodeReadPerms.set(np.cat_node_id, nodeReadPermissions);
            }
            nodeReadPermissions.push(ug);
        } else if (np.permission === "write") {
            let nodeWritePermissions = nodeWritePerms.get(np.cat_node_id);
            if (!nodeWritePermissions) {
                nodeWritePermissions = [];
                nodeWritePerms.set(np.cat_node_id, nodeWritePermissions);
            }
            nodeWritePermissions.push(ug);
        }
    }


    // Store nodes in map
    let nodes = new Map();
    let rootNodes = [];

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
        nodes.set(node.id, node);
        if (node.is_root === true && node.node_type !== 'C') {
            rootNodes.push(node);
        }
        delete node.is_root;

        //Permissions
        let readPerms = nodeReadPerms.get(node.id);
        if (readPerms) {
            node.readPerms = readPerms;
        }
        let writePerms = nodeWritePerms.get(node.id);
        if (writePerms) {
            node.writePerms = writePerms;
        }

    }

    //Store links in map
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

    //Debug Output
    // console.log("writing nodes.json");
    // fs.writeFileSync("./"+folder+"/nodes.json", stringify(nodes, {maxLength:100}), "utf8");
    // console.log("writing links.json");
    // fs.writeFileSync("./"+folder+"/links.json", stringify(links, {maxLength:100}), "utf8");


    let parentIds = new Set();
    let structureSqlCounter = 0;
    let structureSqlDocuments = new Map();
    let helperSqlCounter = 0;
    let helperSqlDocuments = new Map();

    let getChildrenFromNode = (parent) => {
        if (parentIds.has(parent.id) === false) {
            parentIds.add(parent.id);
        } else {
            console.log("already visited")
            return;
        }

        let childrenIds = links.get(parent.id);
        delete parent.id;

        if (parent.dynamic_children) {
            let fileName = zeroFill(3, ++structureSqlCounter) + "." + slug(striptags(parent.name)) + ".sql"
            structureSqlDocuments.set(fileName, parent.dynamic_children);
            parent.dynamic_children_file = fileName;
        }
        delete parent.dynamic_children;

        let childrenArray = [];
        if (childrenIds) {
            for (let childId of childrenIds) {
                let childNode = nodes.get(childId);
                if (childNode) {
                    getChildrenFromNode(childNode);
                    childrenArray.push(childNode);

                }
            }
        }
        if (childrenArray.length > 0) {
            parent.children = childrenArray;
        }
    };


    for (let node of rootNodes) {
        getChildrenFromNode(node);
    }

    let dynchildhelpers = [];
    for (let dynchildhelper of dynchildhelpersResult) {
        let fileName = zeroFill(3, ++helperSqlCounter) + "." + slug(striptags(dynchildhelper.name)) + ".sql"
        helperSqlDocuments.set(fileName, dynchildhelper.code);
        dynchildhelper.code_file = fileName;    
        delete dynchildhelper.id;
        delete dynchildhelper.code;
        dynchildhelpers.push(dynchildhelper);
    }

    return {
        rootNodes,
        structureSqlDocuments,
        dynchildhelpers,
        helperSqlDocuments
    };
}
export default exportStructure;