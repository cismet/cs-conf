import * as cidstools from '../tools/cids';

function flattenStructure(children, level = 0, originals = new Map(), copiesPerOriginal = new Map()) {
    let flattenNodes = [];
    for (let node of children) { 
        node.root = level === 0;
        flattenNodes.push(node);
        if (node.hasOwnProperty('link')) {
            let link = node.link;
            let copies;
            if (copiesPerOriginal.has(link)) {
                copies = copiesPerOriginal.get(link);
            } else {
                copies = [];
            }
            copies.push(node);
            copiesPerOriginal.set(link, copies);        
        } else {
            if (node.hasOwnProperty('key')) {
                originals.set(node.key, node);
            }
            if (node.hasOwnProperty('children')) {
                flattenNodes.push(... flattenStructure(node.children, level+1, originals, copiesPerOriginal));
            }
        }
    } 

    if (level == 0) {
        for (let key of originals.keys()) {
            let original = originals.get(key);
            if (copiesPerOriginal.has(key)) {
                original.copies = copiesPerOriginal.get(key);
            }
        }
    }
    return flattenNodes;
}

function prepareDataDynchilds(dynchildhelpers, helperSqlFiles) {
    let csDynamicChildrenHelperEntries = [];
    for (let h of dynchildhelpers) {
        csDynamicChildrenHelperEntries.push([h.name, helperSqlFiles.get(h.code_file)]);
    }
    return csDynamicChildrenHelperEntries;
}

function prepareCatNodes(nodes, structureSqlFiles) {    
    let csCatNodeEntries = [];
    for (let node of nodes) {
        if (!node.hasOwnProperty('link')) {
            node.id = csCatNodeEntries.length;
            let catNode = [
                node.name,
                node.descr,
                node.table,
                node.object_id,
                node.node_type,
                node.root,
                node.org,
                structureSqlFiles.get(node.dynamic_children_file),
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

            if (node.hasOwnProperty('copies')) {
                for (let copy of node.copies) {
                    copy.id = node.id;
                }
            }
        }
    }
    return csCatNodeEntries;
}

function generateCsCatLinkEntries(node) {
    let csCatLinkEntries = [];
    if (node.hasOwnProperty('children')) {
        for (let child of node.children) {
            let catLink = [ node.id, child.id ];
            csCatLinkEntries.push(catLink);    
            csCatLinkEntries.push(... generateCsCatLinkEntries(child));
        }
    }    
    return csCatLinkEntries;
}

function prepareCatLinks(structure) {
    let csCatLinkEntries = [];
    for (let parent of structure) { 
        csCatLinkEntries.push(... generateCsCatLinkEntries(parent));
    }
    return csCatLinkEntries;
}

function prepareCatNodePerms(nodes) {
    let csCatNodePermEntries=[];
    for (let node of nodes) {
        if (node.hasOwnProperty('readPerms')) {
            for (let groupkey of node.readPerms) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    node.id,
                    "read"
            ]);
            }
        }
        if (node.hasOwnProperty('writePerms')) {
            for (let groupkey of node.writePerms){
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
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

function prepareStructure(structure, structureSqlFiles, dynchildhelpers, helperSqlFiles) {
    let nodes = flattenStructure(structure);
    let csCatNodeEntries = prepareCatNodes(nodes, structureSqlFiles);
    let csCatLinkEntries = prepareCatLinks(structure);
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