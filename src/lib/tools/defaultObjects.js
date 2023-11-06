//config
export const defaultConfigConnection = {
    jdbc: null,
    user: null,
    password: null,
};

export const defaultConfigSync = {
    noDropTables: [],
    noDropColumns: [],
};

export const defaultConfig = {
    formatVersion: 1,
    configsDir: '.',
    domainName: null,
    connection: defaultConfigConnection,
    schema: 'public',
    policies: defaultConfigPolicies,
    policyRules: defaultConfigPolicyRules,
    sync: defaultConfigSync,
    maxFileLength: 80,
};

export const defaultConfigPolicies = {
    server: "STANDARD",
    attributes: "STANDARD",
    classNodes: "STANDARD",
    pureNodes: "STANDARD",
}

export const defaultAdditionalInfos = {
    user: {},
    group: {},
    domain: {},
    class: {},
    configurationAttribute: {},
};

// classes
export const defaultAttribute = {
    name: null,
    descr: '',
    dbType: null,
    extension_attr: false,
    precision: null,
    scale: null,
    cidsType: null,
    oneToMany: null,
    manyToMany: null,
    mandatory: false,
    substitute: false,
    defaultValue: null,
    hidden: false,
    indexed: false,
    arrayKey: null,
    readPerms: [],
    writePerms: [],
    additional_info: null,
};

export const defaultAttributePrimary = (table_name, pk) => { 
    return Object.assign({}, defaultAttribute, {
        name: pk,
        descr: 'Primary Key',
        dbType: 'INTEGER',
        mandatory: true,
        defaultValue: 'nextval(\'' + table_name + '_seq\')',
        hidden: true,
    })
};

// classes
export const defaultClass = {
    enforcedId: null,
    enforcedIdReason: null,
    name: null,
    descr: '',
    pk: 'id',
    substitute: false,
    extension_attr: false,
    indexed: false,
    icon: null,
    classIcon: null,
    objectIcon: null,
    array_link: false,
    policy: null,
    readPerms: [],
    writePerms: [],
    attribute_policy: null,
    toString: null,
    editor: null,
    renderer: null,
    attributes: null,
    attributesOrder: 'auto',
    additionalAttributes: null,
    additional_info: null,
};

// domains, usergroups, usermanagement
export const defaultConfigurationAttributeValue = {
    groups: [],
    value: null,
    xmlfile: null,
    domain: null,
    group: null,
};

export const defaultConfigurationAttributeKey = {
    type: "action",
    additional_info: null,
    inspected: {},
};

// domains
export const defaultDomain = {
    configurationAttributes: {},
    additional_info: null,
    inspected: {},
};

// dynchildhelpers
export const defaultDynchildhelper = {
    code: null,
    code_file: null,
};

// structure
export const defaultNode = {
    name: null,
    table: null,
    derive_permissions_from_class: false,
    org: null,
    object_id: null,
    policy: null,
    readPerms: [],
    writePerms: [],
    node_type: 'N',
    dynamic_children_file: null,
    children: [],
    artificial_id: null,
    key: null,
    link: null,
    url: null,
};

// usergroups
export const defaultUserGroup = {
    descr: null,
    prio: 0,
    configurationAttributes: {},
    additional_info: null,
    inspected: {},
};

// usermanagement
export const defaultUser = {
    pw_hash: null,
    salt: null,
    last_pwd_change: null,
    shadows: [],
    groups: [],
    configurationAttributes: {},
    additional_info: null,
    inspected : {},
};

// ---

export const defaultConfigurationAttributeInspected = {    
    domainValues: {},
    groupValues: {},
    userValues: {},
};

export const defaultUserInspected = {
    memberOf: [],
    shadowMemberOf: {},
    allConfigurationAttributes: {},
    permissions: {},
};

export const defaultUserInspectedPermissions = {
    canReadClasses: [],
    canWriteClasses: [],
    canReadAttributes: [],
    canWriteAttributes: [],
};

export const defaultUserGroupInspected = {
    members: [],
    allConfigurationAttributes: {},
    permissions: {},
};

export const defaultUserGroupInspectedPermissions = {
    canReadClasses: [],
    canWriteClasses: [],
    canReadAttributes: [],
    canWriteAttributes: [],
};

// policyRules
export const defaultConfigPolicyRules = () => {
    return {
        STANDARD: defaultConfigPolicyRule(),
        WIKI: defaultConfigPolicyRule(true, true),
        SECURE: defaultConfigPolicyRule(false, false),
    }
};

export const defaultConfigPolicyRule = (defaultRead = true, defaultWrite = false) => {
    return {
        defaultRead,
        defaultWrite,
    }
};

export const defaultPermissionInspected = {
    read: [],
    write: [],
}    

export const defaultDomainInspected = {
    groups: [],
};

// ---

export function copyFromTemplate(object, template) {
    let copy = {};
    for (let [key, value] of Object.entries(template)) {
        let check = object[key];
        if (
            check != null && !(
                check == value || 
                (check.constructor === Array && check.length == 0) ||
                (check.constructor === Object && Object.keys(check).length == 0) ||  
                false // does nothing, except allows adding by c&p of the last line with ||
            )
        ) {
            copy[key] = object[key];
        }
    }
    return copy;
}