import zeroFill from 'zero-fill';
import slug from 'slug';
import striptags from 'striptags';
import util from 'util';

function exportDynchildhelpers({ csDynamicChildreHelpers }, {}) {
    let dynchildhelpers = [];
    let helperSqlFiles = new Map();

    for (let csDynamicChildreHelper of csDynamicChildreHelpers) {
        let dynchildhelper = Object.assign({}, csDynamicChildreHelper);
        let fileName;
        if (dynchildhelper.filename != null) {
            fileName = dynchildhelper.filename;
        } else {
            fileName = util.format("%s.%s.sql", zeroFill(3, ++helperSqlCounter), slug(striptags(dynchildhelper.name)).toLowerCase());
        }
        delete dynchildhelper.filename;
        helperSqlFiles.set(fileName, dynchildhelper.code);
        dynchildhelper.code_file = fileName;    
        delete dynchildhelper.id;
        delete dynchildhelper.code;
        dynchildhelpers.push(dynchildhelper);
    }

    return {
        dynchildhelpers,
        helperSqlFiles,
    };
}


export default exportDynchildhelpers;