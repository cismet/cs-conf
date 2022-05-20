import * as stmnts from './statements';
import * as dbtools from '../tools/db';

export function prepareData(usergroups) {
    // cs_ug
    let csUGEntries=[];
    let prioCounter=0;
    for (let ug of usergroups) {
        let keyComponents = ug.key.split('@');        
        let name = keyComponents[0];
        let domain = keyComponents.length == 1 ? 'LOCAL' : keyComponents[1];
        let descr = ug.descr;
        csUGEntries.push([name,descr,domain,prioCounter]);
        prioCounter+=10;
    }

    return { csUGEntries };
}

async function importUsergroups(client, usergroups) {
    let { csUGEntries } = prepareData(usergroups);
    await dbtools.singleRowFiller(client,stmnts.simple_cs_ug, csUGEntries);
}

export default importUsergroups;