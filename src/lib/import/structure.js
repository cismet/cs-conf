import * as cidstools from '../tools/cids';

function flattenStructure(children, linkToNode, level = 0) {
    let flattenNodes = [];
    for (let node of children) { 
        node.root = level === 0;
        
        if (node.key != null) {
            linkToNode.set(node.key, node);
        }
        flattenNodes.push(node);
        if (node.children != null) {
            flattenNodes.push(... flattenStructure(node.children, linkToNode, level + 1));
        }
    } 
    return flattenNodes;
}

function prepareDataDynchilds(dynchildhelpers, helperSqlFiles) {
    let csDynamicChildrenHelperEntries = [];
    for (let dynchildhelper of dynchildhelpers) {
        csDynamicChildrenHelperEntries.push([
            dynchildhelper.name, 
            helperSqlFiles.get(dynchildhelper.code_file),
            dynchildhelper.code_file,
            csDynamicChildrenHelperEntries.length + 1,
        ]);
    }
    return csDynamicChildrenHelperEntries;
}

function prepareCatNodes(nodes, structureSqlFiles) {    
    let csCatNodeEntries = [];

    for (let node of nodes) {
        if (node.link == null) {
            node.id = csCatNodeEntries.length;
            let catNode = [
                node.name,
                node.url,
                node.table,
                node.object_id,
                node.node_type,
                node.root,
                node.org,
                structureSqlFiles.get(node.dynamic_children_file),
                node.dynamic_children_file,
                node.sql_sort,
                node.policy,
                node.derive_permissions_from_class,
                node.iconfactory,
                node.icon,
                node.artificial_id,
                node.id          
            ];
            csCatNodeEntries.push(catNode);
            delete node.root;
        }
    }
    return csCatNodeEntries;
}

function generateCsCatLinkEntries(node, linkToNode) {
    let csCatLinkEntries = [];
    if (node.children != null) {
        for (let child of node.children) {
            let catLink = [ node.id, child.link != null ? linkToNode.get(child.link).id : child.id ];
            csCatLinkEntries.push(catLink);    
            csCatLinkEntries.push(... generateCsCatLinkEntries(child, linkToNode));
        }
    }    
    return csCatLinkEntries;
}

function prepareCatLinks(structure, linkToNode) {
    let csCatLinkEntries = [];
    for (let parent of structure) { 
        csCatLinkEntries.push(... generateCsCatLinkEntries(parent, linkToNode));
    }
    return csCatLinkEntries;
}

function prepareCatNodePerms(nodes) {
    let csCatNodePermEntries=[];
    for (let node of nodes) {
        if (node.readPerms != null) {
            for (let groupkey of node.readPerms) {
                let {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    node.id,
                    "read"
            ]);
            }
        }
        if (node.writePerms != null) {
            for (let groupkey of node.writePerms){
                let {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    node.id,
                    "write"
                ]);
            }
        }
    }
    return csCatNodePermEntries;
}

function prepareStructure({ structure, structureSqlFiles, dynchildhelpers, helperSqlFiles }) {
    let linkToNode = new Map();
    let nodes = flattenStructure(structure, linkToNode);

    let csCatNodeEntries = prepareCatNodes(nodes, structureSqlFiles);
    let csCatLinkEntries = prepareCatLinks(structure, linkToNode);
    let csCatNodePermEntries = prepareCatNodePerms(nodes);
    let csDynamicChildrenHelperEntries = prepareDataDynchilds(dynchildhelpers, helperSqlFiles);

    return {
        csCatNodeEntries,
        csCatLinkEntries,
        csCatNodePermEntries,
        csDynamicChildrenHelperEntries
    };
}

export default prepareStructure;