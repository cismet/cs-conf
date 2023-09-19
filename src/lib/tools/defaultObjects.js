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
    configsDir: '.',
    connection: defaultConfigConnection,
    domainName: null,
    schema: 'public',
    maxFileLength: 80,
    sync: defaultConfigSync,
};

// attrPerms
export const defaultAttrPerm = {
    key: null,
    read: [],
    write: [],
};

// classPerms
export const defaultClassPerm = {
    table: null,
    read: [],
    write: [],
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
    attribute_policy: null,
    toString: null,
    editor: null,
    renderer: null,
    attributes: null,
    attributesOrder: 'auto',
    additionalAttributes: null,
};

// domains, usergroups, usermanagement
export const defaultConfigurationAttributes = {
    key: null,
    groups: [],
    keygroup: '__no_group__',
    value: null,
    xmlfile: null,
};

// domains
export const defaultDomain = {
    main: false,
    domainname: null,
    configurationAttributes: [],
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
};

// usergroups
export const defaultUserGroup = {
    key: null,
    descr: null,
    configurationAttributes: [],
};

// usermanagement
export const defaultUser = {
    login_name: null,
    administrator: false,
    pw_hash: null,
    salt: null,
    groups: [],
    configurationAttributes: [],
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