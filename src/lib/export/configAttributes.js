import zeroFill from 'zero-fill';
import xmlFormatter from 'xml-formatter';
import util from 'util';

function exportConfigAttributes({ csConfigAttrs }, {}) {
    const userConfigAttrs = new Map();
    const groupConfigAttrs = new Map();
    const domainConfigAttrs = new Map();
    const xmlFiles = new Map();

    let valuesToFilename = new Map();
    let xmlDocCounter = new Map();
    for (let csConfigAttr of csConfigAttrs) {
        let attrInfo = {
            key: csConfigAttr.key,
            keygroup: csConfigAttr.keygroup
        }
        switch (csConfigAttr.type) {
            case 'C': {
                attrInfo.value = csConfigAttr.value                
            } break;
            case 'X': {
                let xmlToSave;
                try {
                    xmlToSave = xmlFormatter(csConfigAttr.value, { collapseContent: true, lineSeparator: '\n', stripComments: false });
                } catch (formatterProblem) {
                    xmlToSave = csConfigAttr.value;
                }                    

                let fileName;
                if (csConfigAttr.filename != null) {
                    fileName = csConfigAttr.filename;
                } else if (valuesToFilename.has(csConfigAttr.value)) {
                    fileName = valuesToFilename.get(csConfigAttr.value);
                } else {
                    let counter = xmlDocCounter.has(csConfigAttr.key) ? xmlDocCounter.get(csConfigAttr.key) + 1 : 1;
                    xmlDocCounter.set(csConfigAttr.key, counter);
                    fileName = util.format("%s.%s.xml", csConfigAttr.key, zeroFill(4, counter));
                }
                valuesToFilename.set(csConfigAttr.value, fileName);
                xmlFiles.set(fileName, xmlToSave);
                attrInfo.xmlfile = fileName;
            } break;
        }
        if (csConfigAttr.login_name) {
            attrInfo = Object.assign(attrInfo, { groups: [ csConfigAttr.groupkey ] });
            if (userConfigAttrs.has(csConfigAttr.login_name)) {
                let found = false;
                for (let userConfigAttr of userConfigAttrs.get(csConfigAttr.login_name)) {
                    if (userConfigAttr != null && userConfigAttr.key == attrInfo.key) {
                        found = true;
                        if (csConfigAttr.groupkey != null && userConfigAttr.groups != null && !userConfigAttr.groups.contains(csConfigAttr.groupkey)) {
                            userConfigAttr.groups.push(csConfigAttr.groupkey);
                        }
                        break;
                    }
                }
                if (!found) {
                    userConfigAttrs.get(csConfigAttr.login_name).push(attrInfo);
                }
            } else {
                userConfigAttrs.set(csConfigAttr.login_name, [attrInfo]);
            }
        } else if (csConfigAttr.groupkey) {
            if (groupConfigAttrs.has(csConfigAttr.groupkey)) {
                groupConfigAttrs.get(csConfigAttr.groupkey).push(attrInfo);
            } else {
                groupConfigAttrs.set(csConfigAttr.groupkey, [attrInfo]);
            }
        } else if (csConfigAttr.domainname) {
            if (domainConfigAttrs.has(csConfigAttr.domainname)) {
                domainConfigAttrs.get(csConfigAttr.domainname).push(attrInfo);
            } else {
                domainConfigAttrs.set(csConfigAttr.domainname, [attrInfo]);
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