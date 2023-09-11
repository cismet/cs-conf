import zeroFill from 'zero-fill';
import xmlFormatter from 'xml-formatter';
import util from 'util';
import * as stmnts from './statements';

async function exportConfigAttributes(client) {
    const {
        rows: configAttributes
    } = await client.query(stmnts.configAttr);
    return analyzeAndPreprocess(configAttributes);
};

function analyzeAndPreprocess(configAttributes) {
    const userConfigAttrs = new Map();
    const groupConfigAttrs = new Map();
    const domainConfigAttrs = new Map();
    const xmlFiles = new Map();

    let valuesToFilename = new Map();
    let xmlDocCounter = new Map();
    for (let attr of configAttributes) {
        let attrInfo = {
            key: attr.key,
            keygroup: attr.keygroup
        }
        switch (attr.type) {
            case 'C': {
                attrInfo.value = attr.value                
            } break;
            case 'X': {
                let xmlToSave;
                try {
                    xmlToSave = xmlFormatter(attr.value, { collapseContent: true, lineSeparator: '\n', stripComments: false });
                } catch (formatterProblem) {
                    xmlToSave = attr.value;
                }                    

                let fileName;
                if (attr.filename != null) {
                    fileName = attr.filename;
                } else if (valuesToFilename.has(attr.value)) {
                    fileName = valuesToFilename.get(attr.value);
                } else {
                    let counter = xmlDocCounter.has(attr.key) ? xmlDocCounter.get(attr.key) + 1 : 1;
                    xmlDocCounter.set(attr.key, counter);
                    fileName = util.format("%s.%s.xml", attr.key, zeroFill(4, counter));
                }
                valuesToFilename.set(attr.value, fileName);
                xmlFiles.set(fileName, xmlToSave);
                attrInfo.xmlfile = fileName;
            } break;
        }
        if (attr.login_name) {
            attrInfo = Object.assign(attrInfo, { groups: [ attr.groupkey ] });
            if (userConfigAttrs.has(attr.login_name)) {
                let found = false;
                for (let userConfigAttr of userConfigAttrs.get(attr.login_name)) {
                    if (userConfigAttr != null && userConfigAttr.key == attrInfo.key) {
                        found = true;
                        if (attr.groupkey != null && userConfigAttr.groups != null && !userConfigAttr.groups.contains(attr.groupkey)) {
                            userConfigAttr.groups.push(attr.groupkey);
                        }
                        break;
                    }
                }
                if (!found) {
                    userConfigAttrs.get(attr.login_name).push(attrInfo);
                }
            } else {
                userConfigAttrs.set(attr.login_name, [attrInfo]);
            }
        } else if (attr.groupkey) {
            if (groupConfigAttrs.has(attr.groupkey)) {
                groupConfigAttrs.get(attr.groupkey).push(attrInfo);
            } else {
                groupConfigAttrs.set(attr.groupkey, [attrInfo]);
            }
        } else if (attr.domainname) {
            if (domainConfigAttrs.has(attr.domainname)) {
                domainConfigAttrs.get(attr.domainname).push(attrInfo);
            } else {
                domainConfigAttrs.set(attr.domainname, [attrInfo]);
            }
        }
    }
    return {
        userConfigAttrs,
        groupConfigAttrs,
        domainConfigAttrs,
        xmlFiles
    }
};

export default exportConfigAttributes;