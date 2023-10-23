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
    connection: defaultConfigConnection,
    domainName: null,
    schema: 'public',
    maxFileLength: 80,
    sync: defaultConfigSync,
};

export const defaultAdditionalInfos = {
    user: {},
    group: {},
    domain: {},
    class: {},
    attribute: {},
};

// classes
export const defaultAttribute = {
    field: null,
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
    additional_info: {},
};

export const defaultAttributePrimary = (table_name, pk) => { 
        return Object.assign({}, defaultAttribute, {
        field: pk,
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
    table: null,
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
    additional_info: {},
};

// domains, usergroups, usermanagement
export const defaultConfigurationAttributes = {
    key: null,
    groups: [],
    value: null,
    xmlfile: null
};

// domains
export const defaultDomain = {
    configurationAttributes: [],
    additional_info: {},
};

// dynchildhelpers
export const defaultDynchildhelper = {
    name: null,
    code: null,
    code_file: null,
};

// policyRules
export const defaultPolicyRule = {
    policy: null,
    permission: null,
    default_value: null,
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
    key: null,
    link: null,
    url: null,
};

// usergroups
export const defaultUserGroup = {
    descr: null,
    configurationAttributes: [],
    prio: null,
    additional_info: {},
};

// usermanagement
export const defaultUser = {
    pw_hash: null,
    salt: null,
    last_pwd_change: null,
    shadows: [],
    groups: [],
    configurationAttributes: [],
    additional_info: {},
};

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