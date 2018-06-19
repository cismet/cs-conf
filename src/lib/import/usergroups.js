import * as stmnts from './statements';
import * as dbtools from '../tools/db';

export function prepareData(usergroups) {
    // cs_ug
    let csUGEntries=[];
    let prioCounter=0;
    for (let ug of usergroups) {
        const keyComponents=ug.key.split('@');
        const name= keyComponents[0];
        const domain= keyComponents[1];
        const descr=ug.descr;
        csUGEntries.push([name,descr,domain,prioCounter]);
        prioCounter+=10;
    }

    return { csUGEntries };
}

const importUsergroups = async (client, usergroups) => {
    const { csUGEntries } = prepareData(usergroups);
    await dbtools.singleRowFiller(client,stmnts.simple_cs_ug, csUGEntries);
}

export default importUsergroups;