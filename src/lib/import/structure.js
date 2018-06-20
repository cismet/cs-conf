import * as stmnts from './statements';
import * as dbtools from '../tools/db';
import * as cidstools from '../tools/cids';

export function prepareData(structure, sqlFiles) {
    // cs_domain
    let csCatNodeEntries=[];
    let nodeArray=[];


    let flattenNodes=[];

    let baton={
        index: 1000,
        childrenByParent: new Map()
    };
    let rootNodes=addChildrenToArray(structure,csCatNodeEntries,flattenNodes,baton,0,sqlFiles);
    baton.childrenByParent.set("root",rootNodes);
    let structureMap=baton.childrenByParent;
    return { csCatNodeEntries, flattenNodes, structureMap };
}

function addChildrenToArray(children,entryArray,nodeArray,baton,level,sqlFiles){
    let root;
    if (level===0){
        root=true;
    }
    else {
        root=false;
    }
    let localIds=[];
    for (let n of children) { 
        entryArray.push(
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
                baton.index //n.artificial_id
            ]
        );
        nodeArray.push(n);
        n.myid=baton.index;
        localIds.push(n.myid);
        baton.index+=1;
        if (n.children){
            let childIds=addChildrenToArray(n.children,entryArray,nodeArray,baton,level+1,sqlFiles);
            baton.childrenByParent.set(n.myid,childIds);
        }
    } 
    return localIds;

}

export function prepareData2ndTime(flattenNodes, structureMap, dbids) {
    let i=0;
    let internalIdToDbIdMap=new Map();
    // map the internal ids to the db generated ids
    for (let n of flattenNodes) {
        n.dbid=dbids[i].id;
        i+=1;
        internalIdToDbIdMap.set(n.myid,n.dbid);
    }

    //Links
    let csCatLinkEntries=[];

    structureMap.forEach((children,parent) => {
        if (parent!=="root") {
            for (let child of children){
                csCatLinkEntries.push([
                    internalIdToDbIdMap.get(parent),
                    internalIdToDbIdMap.get(child)
                ]);    
            }
        }
    });

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

const importStructure = async (client, structure, sqlFiles) => {
    const { csCatNodeEntries, flattenNodes, structureMap } = prepareData(structure, sqlFiles);
    console.log("importing cat nodes ("+csCatNodeEntries.length+")");
    const {rows: dbids} = await dbtools.nestedFiller(client,stmnts.complex_cs_cat_node, csCatNodeEntries);
    const { csCatLinkEntries, csCatNodePermEntries } = prepareData2ndTime(flattenNodes, structureMap, dbids);
    console.log("importing cat links ("+csCatLinkEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_cat_link, csCatLinkEntries);
    console.log("importing cat node permissions ("+csCatNodePermEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_ug_cat_node_permission, csCatNodePermEntries);
   
}

export default importStructure;
