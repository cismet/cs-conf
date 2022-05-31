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
    descr: null,
    dbType: null,
    precision: null,
    scale: null,
    cidsType: null,
    oneToMany: null,
    manyToMany: null,
    indexed: false,
    mandatory: false,
    hidden: false,
};

// classes
export const defaultClass = {
    table: null,
    name: null,
    descr: null,
    pk: null,
    indexed: false,
    classIcon: null,
    objectIcon: null,
    policy: null,
    toString: null,
    editor: null,
    renderer: null,
    attributes: null,
    additionalAttributes: null,
};

// domains, usergroups, usermanagement
export const defaultConfigurationAttributes = {
    key: null,
    keygroup: "__no_group__",
    value: null,
    xmlfile: null,
};

// domains
export const defaultDomain = {
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