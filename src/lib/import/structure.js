import * as stmnts from './statements';
import * as dbtools from '../tools/db';

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
    for (let n of flattenNodes) {
        n.dbid=dbids[i].id;
        i+=1;
        internalIdToDbIdMap.set(n.myid,n.dbid);
    }
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
    return { csCatLinkEntries };
}

const importStructure = async (client, structure, sqlFiles) => {
    const { csCatNodeEntries, flattenNodes, structureMap } = prepareData(structure, sqlFiles);
    console.log("importing cat nodes ("+csCatNodeEntries.length+")");
    const {rows: dbids} = await dbtools.nestedFiller(client,stmnts.complex_cs_cat_node, csCatNodeEntries);
    const { csCatLinkEntries } = prepareData2ndTime(flattenNodes, structureMap, dbids);
    console.log("importing cat links ("+csCatLinkEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_cat_link, csCatLinkEntries);
}

export default importStructure;
