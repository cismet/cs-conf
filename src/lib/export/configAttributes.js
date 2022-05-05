import zeroFill from 'zero-fill';
import xmlFormatter from 'xml-formatter';

import * as stmnts from './statements';

const exportConfigAttributes = async (client, folder, schema) => {
    console.log("loading Configuration Attributes");
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

    console.log("analyze Configuration Attributes");
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
                    let counter = xmlDocCounter.get(attr.key);
                    if (counter) {
                        counter += 1;
                    } else {
                        counter = 1;
                    }
                    xmlDocCounter.set(attr.key, counter);
                    let xmlToSave;
                    try {
                        xmlToSave = xmlFormatter(attr.value);
                    } catch (formatterProblem) {
                        xmlToSave = attr.value;
                    }
                    let fileName = attr.key + "." + zeroFill(4, counter) + ".xml";
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