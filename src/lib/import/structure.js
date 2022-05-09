import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import * as cidstools from '../tools/cids';
import util from 'util';

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
            node.tmp_id = csCatNodeEntries.length;
            let catNode = [
                node.name,
                node.descr,
                node.table,
                node.object_id,
                node.node_type || 'N',
                node.root,
                node.org,
                structureSqlFiles.get(node.dynamic_children_file),
                node.sql_sort,
                node.policy,
                node.derive_permissions_from_class,
                node.iconfactory,
                node.icon,
                node.artificial_id,
                node.tmp_id          
            ];
            csCatNodeEntries.push(catNode);
            delete node.root;

            if (node.hasOwnProperty('copies')) {
                for (let copy of node.copies) {
                    copy.tmp_id = node.tmp_id;
                }
            }
        }
    }

    return csCatNodeEntries;
}

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

export function generateCsCatLinkEntries(node) {
    let csCatLinkEntries = [];

    if (node.hasOwnProperty('children')) {
        for (let child of node.children) {
            let catLink = [ node.dbid, child.dbid ];
            csCatLinkEntries.push(catLink);    
            csCatLinkEntries.push(... generateCsCatLinkEntries(child));
        }
    }    

    return csCatLinkEntries;
}

function remapDbids(nodes, dbids) {
    let tmpidToDbid = []
    for (let dbid of dbids) {
        tmpidToDbid[dbid.tmp_id] = dbid.id;
    }

    // map the internal ids to the db generated ids
    for(let node of nodes) {
        if (node.hasOwnProperty('tmp_id')) {
            node.dbid = tmpidToDbid[node.tmp_id];
        }
        if (node.hasOwnProperty('copies')) {
            for (let copy of node.copies) {
                if (copy.hasOwnProperty('tmp_id')) {
                    copy.dbid = tmpidToDbid[copy.tmp_id];
                }
            }
        }
    }
}

function prepareCatLinks(structure) {
    let csCatLinkEntries = [];
    for (let parent of structure) { 
        csCatLinkEntries.push(... generateCsCatLinkEntries(parent));
    }
    return csCatLinkEntries;
}

//Permissions
function prepareCatNodePerms(nodes) {
    let csCatNodePermEntries=[];

    for (let node of nodes) {
        if (node.hasOwnProperty('readPerms')) {
            for (let groupkey of node.readPerms) {
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    node.dbid,
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
                    node.dbid,
                    "write"
                ]);
            }
        }
    }
    return csCatNodePermEntries;
}

async function importStructure(client, structure, structureSqlFiles, dynchildhelpers, helperSqlFiles) {
    let nodes = flattenStructure(structure);

    let csCatNodeEntries = prepareCatNodes(nodes, structureSqlFiles);
    console.log(util.format("importing cat nodes (%d)", csCatNodeEntries.length));
    await client.query(stmnts.prepare_cs_cat_node);    
    let { rows: dbids } = await dbtools.nestedFiller(client,stmnts.complex_cs_cat_node, csCatNodeEntries);
    await client.query(stmnts.clean_cs_cat_node);

    remapDbids(nodes, dbids);

    let csCatLinkEntries = prepareCatLinks(structure);
    console.log(util.format("importing cat links (%d)", csCatLinkEntries.length));
    await dbtools.nestedFiller(client,stmnts.complex_cs_cat_link, csCatLinkEntries);

    let csCatNodePermEntries = prepareCatNodePerms(nodes);
    console.log(util.format("importing cat node permissions (%d)", csCatNodePermEntries.length));
    await dbtools.nestedFiller(client,stmnts.complex_cs_ug_cat_node_permission, csCatNodePermEntries);

    let csDynamicChildrenHelperEntries = prepareDataDynchilds(dynchildhelpers, helperSqlFiles);
    console.log(util.format("importing dynamic children helpers (%d)", dynchildhelpers.length));
    await dbtools.singleRowFiller(client,stmnts.simple_cs_dynamic_children_helper, csDynamicChildrenHelperEntries);

    console.log("(re)creating dynamic children helper functions");   
    await client.query(stmnts.execute_cs_refresh_dynchilds_functions);
}

export default importStructure;
