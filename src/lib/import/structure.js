import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import * as cidstools from '../tools/cids';
import { symlinkSync } from 'fs';
import { getSystemErrorMap } from 'util';

export function prepareData(structure, structureSqlFiles, dynchildhelpers, helperSqlFiles) {
    // cs_domain
    let csCatNodeEntries = [];
    let flattenNodes = [];

    addChildrenToArray(structure, csCatNodeEntries, flattenNodes, 0, structureSqlFiles);

    let csDynamicChildrenHelperEntries = [];
    for (let h of dynchildhelpers) {
        csDynamicChildrenHelperEntries.push([h.name, helperSqlFiles.get(h.code_file)]);
    }

    return { csCatNodeEntries, csDynamicChildrenHelperEntries, flattenNodes };
}

function addChildrenToArray(children, csCatNodeEntries, flattenNodes, level, sqlFiles) {
    let root;
    if (level===0){
        root=true;
    }
    else {
        root=false;
    }
    for (let n of children) { 
        let myid = csCatNodeEntries.push(
            [
                n.name,
                n.descr,
                n.table,
                n.object_id,
                n.node_type||'N',
                root,
                n.org,
                sqlFiles.get(n.dynamic_children_file),
                n.sql_sort,
                n.policy,
                n.derive_permissions_from_class,
                n.iconfactory,
                n.icon,
                n.artificial_id
            ]
        );
        flattenNodes.push(n);
        if (n.children) {
            addChildrenToArray(n.children, csCatNodeEntries, flattenNodes, level+1, sqlFiles);
        }
    } 
}

export function generateCsCatLinkEntries(parent, csCatLinkEntries) {
    if (parent.hasOwnProperty('children')) {
        let children = parent.children;
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            console.log("parent", parent);
            console.log("child", child);
            csCatLinkEntries.push([
                parent.dbid,
                child.dbid
            ]);    
            generateCsCatLinkEntries(child, csCatLinkEntries);
        }
    }    
}

export function prepareData2ndTime(structure, flattenNodes, dbids) {
    // map the internal ids to the db generated ids
    for (let i = 0; i < flattenNodes.length; i++) {
        if (i < dbids.length) {
            let dbid = dbids[i];
            flattenNodes.dbid = dbid;
        }
    }

    //Links
    let csCatLinkEntries=[];
    for (let parent of structure) { 
        generateCsCatLinkEntries(parent, csCatLinkEntries)
    }

    //Permissions
    let csCatNodePermEntries=[];

    for (let n of flattenNodes) {
        if (n.readPerms) {
            for (let groupkey of n.readPerms){
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    n.dbid,
                    "read"
            ]);
            }
        }
        if (n.writePerms) {
            for (let groupkey of n.writePerms){
                const {group, domain} = cidstools.extractGroupAndDomain(groupkey);
                csCatNodePermEntries.push([
                    group,
                    domain,
                    n.dbid,
                    "write"
                ]);
            }
        }
    }
    return { csCatLinkEntries, csCatNodePermEntries };
}

const importStructure = async (client, structure, structureSqlFiles, dynchildhelpers, helperSqlFiles) => {
    const { csCatNodeEntries, csDynamicChildrenHelperEntries, flattenNodes } = prepareData(structure, structureSqlFiles, dynchildhelpers, helperSqlFiles);
    console.log("importing cat nodes ("+csCatNodeEntries.length+")");
    const {rows: dbids} = await dbtools.nestedFiller(client,stmnts.complex_cs_cat_node, csCatNodeEntries);
    for(let i = 0; i < csCatNodeEntries.length; i++) {
        let n = flattenNodes[i];
        n.dbid = dbids[i];
    }
    const { csCatLinkEntries, csCatNodePermEntries } = prepareData2ndTime(structure, flattenNodes, dbids);
    console.log("importing cat links ("+csCatLinkEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_cat_link, csCatLinkEntries);
    console.log("importing cat node permissions ("+csCatNodePermEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_ug_cat_node_permission, csCatNodePermEntries);
    console.log("importing dynamic children helpers ("+dynchildhelpers.length+")");   
    await dbtools.singleRowFiller(client,stmnts.simple_cs_dynamic_children_helper, csDynamicChildrenHelperEntries);
    console.log("(re)creating dynamic children helper functions");   
    await client.query(stmnts.execute_cs_refresh_dynchilds_functions);

}

export default importStructure;
