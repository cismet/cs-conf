import zeroFill from 'zero-fill';
import xmlFormatter from 'xml-formatter';
import util from 'util';
import * as stmnts from './statements';

const exportConfigAttributes = async (client, folder, schema) => {
    const {
        rows: configAttributes
    } = await client.query(stmnts.configAttr);
    return analyzeAndPreprocess(configAttributes);
};

export function analyzeAndPreprocess(configAttributes) {
    const userConfigAttrs = new Map();
    const groupConfigAttrs = new Map();
    const domainConfigAttrs = new Map();
    const xmlFiles = new Map();

    console.log("analyzing Configuration Attributes");
    let xmlDocCounter = new Map();
    for (let attr of configAttributes) {
        let attrInfo = {
            key: attr.key,
            keygroup: attr.keygroup
        }
        switch (attr.type) {
            case 'C':
                {
                    attrInfo.value = attr.value
                    break;
                }
            case 'X':
                {
                    let counter = xmlDocCounter.has(attr.key) ? xmlDocCounter.get(attr.key) + 1 : 1;
                    xmlDocCounter.set(attr.key, counter);
                    let xmlToSave;
                    try {
                        xmlToSave = xmlFormatter(attr.value, { collapseContent: true, lineSeparator: '\n' });
                    } catch (formatterProblem) {
                        xmlToSave = attr.value;
                    }
                    let fileName = util.format("%s.%s.xml", attr.key, zeroFill(4, counter));
                    xmlFiles.set(fileName, xmlToSave);
                    attrInfo.xmlfile = fileName;
                }
        }
        if (attr.login_name) {
            let allAttributesForUser = userConfigAttrs.get(attr.login_name);
            if (allAttributesForUser) {
                allAttributesForUser.push(attrInfo);
            } else {
                userConfigAttrs.set(attr.login_name, [attrInfo]);
            }
        } else if (attr.groupkey) {
            let allAttributesForGroup = groupConfigAttrs.get(attr.groupkey);
            if (allAttributesForGroup) {
                allAttributesForGroup.push(attrInfo);
            } else {
                groupConfigAttrs.set(attr.groupkey, [attrInfo]);
            }
        } else if (attr.domainname) {
            let allAttributesForDomain = domainConfigAttrs.get(attr.domainname);
            if (allAttributesForDomain) {
                allAttributesForDomain.push(attrInfo);
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