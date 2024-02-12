export const defaultConfigs = () => ({
    config: defaultConfig(),
    additionalInfos: defaultAdditionalInfos(),
    xmlFiles: [],
    configurationAttributes: {},
    domains: {}, 
    usergroups: {}, 
    usermanagement: {}, 
    classes: {}, 
    helperSqlFiles: [],
    dynchildhelpers: {},
    structureSqlFiles: [],
    structure: [], 
    normalized: false,
});

//config
export const defaultConfig = () => ({
    formatVersion: 1,
    configsDir: '.',
    domainName: null,
    connection: defaultConfigConnection(),
    schema: 'public',
    policies: defaultConfigPolicies(),
    policyRules: defaultConfigPolicyRules(),
    version: defaultConfigVersion(),
    sync: defaultConfigSync(),
    maxFileLength: 80,
    normalized: false,
});

export const defaultConfigConnection = () => ({
    jdbc: null,
    user: null,
    password: null,
    normalized: false,
});

export const defaultConfigVersion = () => ({
    checkForCommands: "all",
    checkUrl: "https://api.github.com/repos/cismet/cs-conf/releases/latest",
    releasesUrl: "https://github.com/cismet/cs-conf/releases/",
});

export const defaultConfigSync = () => ({
    noDropTables: [],
    noDropColumns: [],
    normalized: false,
});

export const defaultConfigPolicies = () => ({
    server: "STANDARD",
    attributes: "STANDARD",
    classNodes: "STANDARD",
    pureNodes: "STANDARD",
    normalized: false,
});

export const defaultAdditionalInfos = () => ({
    user: {},
    group: {},
    domain: {},
    class: {},
    configurationAttribute: {},
    normalized: false,
});

// classes
export const defaultAttribute = () => ({
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
    normalized: false,
});

export const defaultAttributePrimary = (table_name, pk) => { 
    return Object.assign({}, defaultAttribute(), {
        name: pk,
        descr: 'Primary Key',
        dbType: 'INTEGER',
        mandatory: true,
        defaultValue: 'nextval(\'' + table_name + '_seq\')',
        hidden: true,
        normalized: false,
    })
};

// classes
export const defaultClass = () => ({
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
    normalized: false,
});

// domains, usergroups, usermanagement
export const defaultConfigurationAttributeValue = () => ({
    groups: [],
    type: null,
    value: null,
    xmlfile: null,
    domain: null,
    group: null,
    normalized: false,
});

export const defaultConfigurationAttribute = () => ({
    type: "action",
    additional_info: null,
    inspected: defaultConfigurationAttributeInspected(),
    normalized: false,
});

// domains
export const defaultDomain = () => ({
    configurationAttributes: {},
    additional_info: null,
    inspected: defaultDomainInspected(),
    normalized: false,
});

// dynchildhelpers
export const defaultDynchildhelper = () => ({
    code: null,
    code_file: null,
    normalized: false,
});

// structure
export const defaultNode = () => ({
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
    normalized: false,
});

// usergroups
export const defaultUserGroup = () => ({
    descr: null,
    prio: 0,
    configurationAttributes: {},
    additional_info: null,
    inspected: defaultUserGroupInspected(),
    normalized: false,
});

// usermanagement
export const defaultUser = () => ({
    pw_hash: null,
    salt: null,
    last_pwd_change: null,
    shadows: [],
    groups: [],
    configurationAttributes: {},
    additional_info: null,
    inspected : defaultUserInspected(),
    normalized: false,
});

// ---

export const defaultConfigurationAttributeInspected = () => ({    
    domainValues: {},
    groupValues: {},
    userValues: {},
    normalized: false,
});

export const defaultUserInspected = () => ({
    memberOf: [],
    shadowMemberOf: {},
    allConfigurationAttributes: {},
    permissions: defaultUserInspectedPermissions(),
    normalized: false,
});

export const defaultUserInspectedPermissions = () => ({
    canReadClasses: [],
    canWriteClasses: [],
    canReadAttributes: [],
    canWriteAttributes: [],
    normalized: false,
});

export const defaultUserGroupInspected = () => ({
    members: [],
    allConfigurationAttributes: {},
    permissions: defaultUserGroupInspectedPermissions(),
    normalized: false,
});

export const defaultUserGroupInspectedPermissions = () => ({
    canReadClasses: [],
    canWriteClasses: [],
    canReadAttributes: [],
    canWriteAttributes: [],
    normalized: false,
});

// policyRules
export const defaultConfigPolicyRules = () => ({
    STANDARD: defaultConfigPolicyRule(),
    WIKI: defaultConfigPolicyRule(true, true),
    SECURE: defaultConfigPolicyRule(false, false),
});

const defaultConfigPolicyRule = (defaultRead = true, defaultWrite = false) => ({
    defaultRead,
    defaultWrite,
    normalized: false,
});

export const defaultDomainInspected = () => ({
    groups: [],
    normalized: false,
});
