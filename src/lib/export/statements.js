export const configAttr = `
    select 
        u.login_name,
        md.name domainname,
        ug.name||'@'||ugd.name groupkey,
        k.key,
        k.group_name keygroup,
        t.type,
        v.value
    FROM 
        cs_config_attr_jt jt
        INNER JOIN cs_config_attr_key k ON (jt.key_id=k.id)
        INNER JOIN cs_config_attr_type t ON (jt.type_id=t.id)
        INNER JOIN cs_config_attr_value v ON (jt.val_id=v.id) 
        LEFT OUTER JOIN cs_domain md ON (jt.dom_id=md.id)
        LEFT OUTER JOIN cs_usr u ON (jt.usr_id=u.id) 
        LEFT OUTER JOIN cs_ug ug ON (jt.ug_id=ug.id) LEFT OUTER JOIN cs_domain ugd ON (ug."domain"=ugd.id)
        order by 1,3,2,4,5,6,7;
`;

export const domains = `
    select 
        name domainname from cs_domain order by id;
`;

export const policyDefaults = `
    select 
        po."name" "policy", per."key" permission, default_value  
    from 
        cs_policy_rule r, cs_policy po, cs_permission per 
    where 
        r.policy=po.id 
        and r.permission=per.id
    order by 1,2;
`;

export const users = ` 
    select 
        login_name, last_pwd_change,administrator,trim(pw_hash) pw_hash,trim(salt) salt
    from 
        cs_usr u 
    order by 
        u.login_name;
`;

export const usergroups = `
    select 
        cs_domain.name as domain,cs_ug.name, cs_ug.descr
    from 
        cs_ug, cs_domain 
    where 
        cs_ug.domain=cs_domain.id 
    order by prio,1,2;
`;

export const usergroupmembership = ` 
    select distinct
    login_name, d.name domainname, g.name groupname
    from 
        cs_ug_membership m 
        INNER JOIN cs_usr u ON (m.usr_id=u.id)
        INNER JOIN cs_ug g ON (m.ug_id=g.id) 
        INNER JOIN cs_domain d ON (d.id=g.domain)
    order by 1,2,3;
`;

export const classes = `
    SELECT 
        c.table_name "table", c.name,c.descr,c.primary_key_field pk,c.indexed,
        ci.file_name "classIcon", oi.file_name "objectIcon", null as icon,
        jcs.type toStringType, jcs.qualifier toStringClass,
        jce.type editorType, jce.qualifier editorClass,
        jcr.type rendererType, jcr.qualifier rendererClass,
        c.array_link,
        cp.name "policy", ap.name attribute_policy
    FROM 
        cs_class c 
        LEFT OUTER JOIN cs_icon ci ON (c.class_icon_id=ci.id)
        LEFT OUTER JOIN cs_icon oi ON (c.object_icon_id=oi.id)
        LEFT OUTER JOIN cs_java_class jcs on (c.tostring=jcs.id)
        LEFT OUTER JOIN cs_java_class jce on (c.editor=jce.id)
        LEFT OUTER JOIN cs_java_class jcr on (c.renderer=jcr.id)
        LEFT OUTER JOIN cs_policy cp on (c.policy=cp.id)
        LEFT OUTER JOIN cs_policy ap on (c.attribute_policy=ap.id)

    ORDER BY c.id;
`;

export const attributes = `
    SELECT 
        a.field_name field, a.name, c.table_name "table" ,a.descr,
        t.name "dbType",tc.table_name "cidsType",tc.table_name "oneToMany", tc.table_name "manyToMany", a.precision, a.scale, a.extension_attr, NOT a.optional mandatory, a.default_value "defaultValue",
        a.foreign_key, a.foreign_key_references_to "foreignKeyTableId", fkc.table_name foreignkeytable, a.substitute,
        NOT a.visible hidden, a.indexed,
        a.isarray "isArrray", a.array_key "arrayKey",
        jcs.type toStringType, jcs.qualifier toStringClass,
        jce.type editorType, jce.qualifier editorClass,
        jcce.type complexEditorType, jcce.qualifier complexEditorClass
    FROM 
        cs_attr a
        LEFT OUTER JOIN cs_class c ON (a.class_id=c.id)
        LEFT OUTER JOIN cs_type t ON (a.type_id=t.id)
        LEFT OUTER JOIN cs_class tc ON (t.class_id=tc.id)
        LEFT OUTER JOIN cs_class fkc ON (a.foreign_key_references_to=fkc.id)
        LEFT OUTER JOIN cs_java_class jcs on (c.tostring=jcs.id)
        LEFT OUTER JOIN cs_java_class jce on (c.editor=jce.id)
        LEFT OUTER JOIN cs_java_class jcce on (c.renderer=jcce.id)
    ORDER BY
        a.class_id, a.pos;
`;

export const classAttributes = `
    SELECT 
        c.table_name "table", attr_key "key", attr_value "value" 
    FROM 
        cs_class_attr ca
        JOIN cs_class c ON (c.id=ca.class_id)
    ORDER BY 
    class_id, attr_key;
`;

export const classPermissions = `
SELECT
    d.name "domain", g.name "group", c.table_name "table", p."key" "permission"
FROM
    cs_ug_class_perm ugp
    JOIN cs_permission p ON (p.id=ugp.permission)
    JOIN cs_class c ON (ugp.class_id=c.id)
    JOIN cs_ug g ON (ugp.ug_id=g.id)
    JOIN cs_domain d ON  (g.domain=d.id)
ORDER BY 
    c.id,3,1,2;
`;

export const attributePermissions = `
    SELECT
        d.name "domain", g.name "group", c.table_name "table",attr.field_name "field", p."key" "permission"
    FROM
        cs_ug_attr_perm ugap
        JOIN cs_permission p ON (p.id=ugap.permission)
        JOIN cs_attr attr ON (ugap.attr_id=attr.id)
        JOIN cs_class c ON (attr.class_id=c.id)
        JOIN cs_ug g ON (ugap.ug_id=g.id)
        JOIN cs_domain d ON  (g.domain=d.id)
    ORDER BY 
        c.id,3,1,2;
`;

export const nodes = `
    SELECT 
        n.id, n.name, ub.prot_prefix||ub."server"||ub.path||u.object_name as descr,
        c.table_name as "table", derive_permissions_from_class, object_id, node_type, is_root, n.org, dynamic_children, sql_sort,
        p.name "policy", 
        iconfactory, icon, artificial_id
    FROM
        cs_cat_node n
        --LEFT OUTER JOIN cs_cat_link l ON (l.id_from=n.id)
        LEFT OUTER JOIN url u ON (n.descr=u.id)
        LEFT OUTER JOIN url_base ub ON (u.url_base_id=ub.id)
        LEFT OUTER JOIN cs_class "c" ON (n.class_id=c.id)
        LEFT OUTER JOIN cs_policy p ON (n.policy=p.id)
    ORDER BY
        n.name;
`;

export const dynchildhelpers = `
SELECT 
    id, name, code
FROM
    cs_dynamic_children_helper
ORDER BY
    name;
`;

export const links = `
    SELECT 
        id_from,id_to,org 
    FROM 
        cs_cat_link l
        JOIN cs_domain d ON (d.id=l.domain_to)
    WHERE 
        d.name = 'LOCAL' OR d.name = 'WUNDA_BLAU';     
`;

export const nodePermissions = `
    SELECT 
        d.name "domain", g.name "group", cnp.cat_node_id, p."key" "permission"
    FROM 
        cs_ug_cat_node_perm cnp
        JOIN cs_permission p ON (p.id=cnp.permission)
        JOIN cs_ug g ON (cnp.ug_id=g.id)
        JOIN cs_domain d ON  (g.domain=d.id);
`;