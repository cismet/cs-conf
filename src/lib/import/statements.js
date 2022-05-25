export const simple_cs_domain = `
INSERT INTO cs_domain (name, id) VALUES ($1, $2);
`;

export const simple_cs_policy_rules = `
INSERT INTO cs_policy_rule (policy, permission, default_value, id) VALUES (
    (SELECT id FROM cs_policy WHERE name = $1),
    (SELECT id from cs_permission WHERE key = $2),
    $3,
    $4
);
`;

export const simple_cs_ug = `
INSERT INTO cs_ug (name, descr, domain, prio, id) VALUES (
    $1, 
    $2, 
    (SELECT id FROM cs_domain WHERE name = $3), 
    $4,
    $5
);
`;

export const simple_cs_usr = `
INSERT INTO cs_usr (login_name, password, last_pwd_change, administrator, pw_hash, salt, last_pw_hash, last_salt, id) VALUES (
    $1, 
    '*',
    CURRENT_TIMESTAMP, 
    $2, 
    $3, 
    $4, 
    NULL, 
    NULL,
    $5
);
`;

export const nested_cs_ug_membership = `
INSERT INTO cs_ug_membership (ug_id, usr_id, ug_domain) 
    SELECT cs_ug.id,cs_usr.id,cs_ug.domain FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[])
    ) AS t(g, u, d) 
    JOIN cs_ug ON (cs_ug.name=g) 
    JOIN cs_usr ON (cs_usr.login_name=u)   
    JOIN cs_domain ON (cs_ug.domain=cs_domain.id)
;
`;     

// $1 = cs_config_attr_key.key
// $2 = cs_config_attr_key.group_name
export const simple_cs_config_attr_key = `
INSERT INTO cs_config_attr_key (id, "key", group_name) VALUES (DEFAULT, $1, $2);
`;

// $1 = domain[[]
// $2 = group[]
// $3 = user[]
// $4 = key[]
export const complex_cs_config_attrs4A = `
INSERT INTO cs_config_attr_jt (usr_id, ug_id, dom_id, key_id, val_id, type_id) 
    SELECT cs_usr.id user_id, cs_ug.id group_id,cs_domain.id domain_id, cs_config_attr_key.id key_id, 1,cs_config_attr_type.id type_id
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]), 
        UNNEST($4::text[])
    ) AS t(d, g, u, k) 
    LEFT OUTER JOIN cs_domain ugd ON (ugd.name=d) 
    LEFT OUTER JOIN cs_ug ON (cs_ug.name=g AND cs_ug.domain=ugd.id) 
    LEFT OUTER JOIN cs_domain ON (cs_domain.name=d) 
    LEFT OUTER JOIN cs_usr ON (cs_usr.login_name=u)
    JOIN cs_config_attr_key ON (cs_config_attr_key.key=k)
    JOIN cs_config_attr_type ON (cs_config_attr_type.type='A')
;
`;

export const simple_cs_config_attr_value = `
INSERT INTO cs_config_attr_value (id, value) VALUES (DEFAULT, $1);
`;

// $1 = domain[[]
// $2 = group[]
// $3 = user[]
// $4 = key[]
// $5 = type[]
// $6 = value[]
export const complex_cs_config_attrs_C_X = `
INSERT INTO cs_config_attr_jt (usr_id, ug_id, dom_id, key_id, val_id, type_id) 
    SELECT
        cs_usr.id user_id, 
        cs_ug.id group_id,
        cs_domain.id domain_id, 
        cs_config_attr_key.id key_id, 
        cs_config_attr_value.id value_id, 
        cs_config_attr_type.id type_id
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]), 
        UNNEST($4::text[]), 
        UNNEST($5::text[]), 
        UNNEST($6::text[])
    ) AS t(d, g, u, k, t, v) 
    LEFT OUTER JOIN cs_domain ugd ON (ugd.name=d) 
    LEFT OUTER JOIN cs_ug ON (cs_ug.name=g AND cs_ug.domain=ugd.id) 
    LEFT OUTER JOIN cs_domain ON (cs_domain.name=d) 
    LEFT OUTER JOIN cs_usr ON (cs_usr.login_name=u)
    JOIN cs_config_attr_key ON (cs_config_attr_key.key=k)
    JOIN cs_config_attr_type ON (cs_config_attr_type.type=t)
    JOIN cs_config_attr_value ON (cs_config_attr_value.value=v)
;
`;

export const simple_cs_icon = `
INSERT INTO cs_icon ("name", file_name) VALUES ($1, $2);
`;

export const simple_cs_java_class = `
INSERT INTO cs_java_class (qualifier, notice, "type") VALUES ($1, NULL, $2);
`;

export const simple_cs_dynamic_children_helper = `
INSERT INTO cs_dynamic_children_helper (name, code, id) VALUES ($1, $2, $3);
`;

export const execute_cs_refresh_dynchilds_functions = `
SELECT cs_refresh_dynchilds_functions();
`;

export const complex_cs_class = `
INSERT INTO cs_class (name, descr, class_icon_id, object_icon_id, table_name, primary_key_field, indexed, tostring, editor, renderer, array_link, policy, attribute_policy, id) 
    SELECT n , d, class_icons.id, object_icons.id, t, pk, i, toStringClasses.id, editorClasses.id, rendererClasses.id, a, class_policy.id, attribute_policy.id, tid
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[]), 
        UNNEST($3::text[]),         
        UNNEST($4::text[]), 
        UNNEST($5::text[]), 
        UNNEST($6::text[]), 
        UNNEST($7::bool[]), 
        UNNEST($8::text[]), 
        UNNEST($9::text[]), 
        UNNEST($10::text[]), 
        UNNEST($11::text[]), 
        UNNEST($12::text[]), 
        UNNEST($13::text[]), 
        UNNEST($14::bool[]), 
        UNNEST($15::text[]), 
        UNNEST($16::text[]),
        UNNEST($17::integer[])
    ) AS t(n, d, ci, oi, t, pk, i, tsc, tst, ec, et, rc, rt, a, p, ap, tid)
    LEFT OUTER JOIN cs_icon class_icons ON (ci=class_icons.file_name)
    LEFT OUTER JOIN cs_icon object_icons ON (oi=object_icons.file_name)
    LEFT OUTER JOIN cs_java_class toStringClasses ON (tsc=toStringClasses.qualifier AND tst=toStringClasses.type)
    LEFT OUTER JOIN cs_java_class editorClasses ON (ec=editorClasses.qualifier AND et=editorClasses.type)
    LEFT OUTER JOIN cs_java_class rendererClasses ON (rc=rendererClasses.qualifier AND rt=rendererClasses.type)
    LEFT OUTER JOIN cs_policy class_policy ON (p=class_policy.name)
    LEFT OUTER JOIN cs_policy attribute_policy ON (ap=attribute_policy.name)
;
`;

export const complex_cs_type = `
INSERT INTO cs_type ("name", class_id, complex_type, descr, editor, renderer) 
    SELECT n, cs_class.id,true, null, null, null
    FROM (SELECT 
        UNNEST($1::text[]), 
        UNNEST($2::text[])
    ) AS t(n, tn)
    JOIN cs_class ON (cs_class.table_name=tn)
;
`;

export const complex_cs_attr4dbTypes = `
INSERT INTO cs_attr (
    class_id, type_id, "name", field_name, foreign_key, substitute, 
    foreign_key_references_to, descr, visible, indexed, isarray, 
    array_key, editor, tostring, complex_editor, optional, 
    default_value, from_string, pos, "precision", "scale", extension_attr
) 
    SELECT 
        cs_class.id,cs_type.id,n,fn,fk,s,
        foreign_key_class.id,d,v,i,arr,
        ak, editor_jc.id, toString_jc.id, complexeditor_jc.id, o,
        dv, fromString_jc.id,p,pr,sc,ea
    FROM (SELECT
        UNNEST($1::text[]), -- table
        UNNEST($2::text[]), -- type_name
        UNNEST($3::text[]), -- name
        UNNEST($4::text[]), -- fieldname
        UNNEST($5::bool[]), -- foreign_key
        UNNEST($6::bool[]), -- substitute
        UNNEST($7::text[]), -- foreign_key_references_to_table_name
        UNNEST($8::text[]), -- descr
        UNNEST($9::bool[]), -- visible
        UNNEST($10::bool[]), -- indexed
        UNNEST($11::bool[]), -- isarray
        UNNEST($12::text[]), -- array_key
        UNNEST($13::text[]), -- editor class
        UNNEST($14::text[]), -- editor type
        UNNEST($15::text[]), -- tostring class
        UNNEST($16::text[]), -- tostring type
        UNNEST($17::text[]), -- complex_editor class
        UNNEST($18::text[]), -- complex_editor type
        UNNEST($19::bool[]), -- optional
        UNNEST($20::text[]), -- default_value
        UNNEST($21::text[]), -- from_string class
        UNNEST($22::text[]), -- from_string type
        UNNEST($23::integer[]), -- pos
        UNNEST($24::integer[]), -- precision
        UNNEST($25::integer[]), -- scale
        UNNEST($26::bool[]) -- extension attribute
    ) AS t(t,tn,n,fn,fk,s,fktn,d,v,i,arr,ak,ec,et,tsc,tst,cec,cet,o,dv,fsc,fst,p,pr,sc,ea)
    JOIN cs_class ON (t=cs_class.table_name)
    JOIN cs_type ON (tn=cs_type.name)
    LEFT OUTER JOIN cs_class foreign_key_class ON (fktn=foreign_key_class.table_name)
    LEFT OUTER JOIN cs_java_class editor_jc ON (ec=editor_jc.qualifier AND et=editor_jc.type)
    LEFT OUTER JOIN cs_java_class toString_jc ON (tsc=toString_jc.qualifier AND tst=toString_jc.type)
    LEFT OUTER JOIN cs_java_class complexeditor_jc ON (cec=complexeditor_jc.qualifier AND cet=complexeditor_jc.type)
    LEFT OUTER JOIN cs_java_class fromString_jc ON (fsc=fromString_jc.qualifier AND fst=fromString_jc.type)
;
`;

export const complex_cs_attr4cidsTypes = `
INSERT INTO cs_attr (
    class_id, type_id, "name", field_name, foreign_key, substitute, 
    foreign_key_references_to, descr, visible, indexed, isarray, 
    array_key, editor, tostring, complex_editor, optional, 
    default_value, from_string, pos, "precision", "scale", extension_attr
) 
    SELECT  
        cs_class.id ,cs_type.id,n,fn,fk,s,
        type_class.id*xx,d,v,i,arr,
        ak, editor_jc.id, toString_jc.id, complexeditor_jc.id, o,
        dv, fromString_jc.id,p,pr,sc,ea
    FROM (SELECT
        UNNEST($1::text[]), -- table
        UNNEST($2::text[]), -- type_name (4 cidsTypes the table_name of the foreign key table)
        UNNEST($3::text[]), -- name
        UNNEST($4::text[]), -- fieldname
        UNNEST($5::bool[]), -- foreign_key
        UNNEST($6::bool[]), -- substitute
        UNNEST($7::text[]), -- foreign_key_references_to_table_name
        UNNEST($8::text[]), -- descr
        UNNEST($9::bool[]), -- visible
        UNNEST($10::bool[]), -- indexed
        UNNEST($11::bool[]), -- isarray
        UNNEST($12::text[]), -- array_key
        UNNEST($13::text[]), -- editor class
        UNNEST($14::text[]), -- editor type
        UNNEST($15::text[]), -- tostring class
        UNNEST($16::text[]), -- tostring type
        UNNEST($17::text[]), -- complex_editor class
        UNNEST($18::text[]), -- complex_editor type
        UNNEST($19::bool[]), -- optional
        UNNEST($20::text[]), -- default_value
        UNNEST($21::text[]), -- from_string class
        UNNEST($22::text[]), -- from_string type
        UNNEST($23::integer[]), -- pos
        UNNEST($24::integer[]), -- precision
        UNNEST($25::integer[]), -- scale
        UNNEST($26::bool[]), -- extension attribute
        UNNEST($27::integer[]) -- -1 if oneToMany or 1 if else
    ) AS t(t,tn,n,fn,fk,s,fktn,d,v,i,arr,ak,ec,et,tsc,tst,cec,cet,o,dv,fsc,fst,p,pr,sc,ea,xx)
    JOIN cs_class ON (t=cs_class.table_name)
    JOIN cs_class type_class ON (tn=type_class.table_name)
    JOIN cs_type ON (cs_type.class_id=type_class.id)
    LEFT OUTER JOIN cs_java_class editor_jc ON (ec=editor_jc.qualifier AND et=editor_jc.type)
    LEFT OUTER JOIN cs_java_class toString_jc ON (tsc=toString_jc.qualifier AND tst=toString_jc.type)
    LEFT OUTER JOIN cs_java_class complexeditor_jc ON (cec=complexeditor_jc.qualifier AND cet=complexeditor_jc.type)
    LEFT OUTER JOIN cs_java_class fromString_jc ON (fsc=fromString_jc.qualifier AND fst=fromString_jc.type)
;
`;

export const complex_cs_class_attr = `
INSERT INTO cs_class_attr (class_id, type_id, attr_key, attr_value, id) 
    SELECT 
        cs_class.id, cs_type.id, key, value, tid
    FROM (SELECT
        UNNEST($1::text[]), -- table
        UNNEST($2::text[]), -- attr_key
        UNNEST($3::text[]), -- attr_value
        UNNEST($4::integer[]) -- id
    )  AS t(tn, key, value, tid)
    JOIN cs_class ON (tn=cs_class.table_name)
    JOIN cs_type ON (cs_type.name='TEXT')
;
`;

export const complex_cs_class_permission = `
INSERT INTO cs_ug_class_perm (ug_id, class_id, permission, domain, id) 
    SELECT 
        cs_ug.id uid, cs_class.id cid, cs_permission.id pid, null, tid
    FROM (SELECT
        UNNEST($1::text[]), -- group name
        UNNEST($2::text[]), -- group domain
        UNNEST($3::text[]), -- table_name
        UNNEST($4::text[]), -- permission,
        UNNEST($5::integer[]) -- id
    )  AS t(g, d, t, p, tid)   
   JOIN cs_class ON (t=cs_class.table_name)
   JOIN cs_domain ON (d=cs_domain.name)
   JOIN cs_ug ON (g=cs_ug.name AND cs_domain.id=cs_ug.domain)
   JOIN cs_permission ON (p=cs_permission.key)
;
`;

export const complex_cs_attr_permission = `
INSERT INTO cs_ug_attr_perm (ug_id, attr_id, permission, domain, id) 
    SELECT 
        cs_ug.id uid, cs_class.id cid, cs_permission.id pid, null, tid
    FROM (SELECT
        UNNEST($1::text[]), -- group name
        UNNEST($2::text[]), -- group domain
        UNNEST($3::text[]), -- table_name
        UNNEST($4::text[]), -- attribute
        UNNEST($5::text[]), -- permission
        UNNEST($6::integer[]) -- id
    )  AS t(g, d, t, a, p, tid)   
   JOIN cs_class ON (t=cs_class.table_name)
   JOIN cs_attr ON (a=cs_attr.field_name AND cs_attr.class_id=cs_class.id
   JOIN cs_domain ON (d=cs_domain.name)
   JOIN cs_ug ON (g=cs_ug.name AND cs_domain.id=cs_ug.domain)
   JOIN cs_permission ON (p=cs_permission.key)
;
`;

export const complex_cs_cat_node = `
INSERT INTO cs_cat_node (
    name, url, class_id, object_id, node_type, 
    is_root, org, dynamic_children, sql_sort, policy, 
    derive_permissions_from_class, iconfactory, icon, artificial_id, id
) 
    SELECT     
        n, d, cs_class.id, oid, nt,
        ir, o, dc, ss, cs_policy.id, 
        dpc, null, i, aid, tid
    FROM (SELECT
        UNNEST($1::text[]), -- name
        UNNEST($2::text[]), -- descrurl
        UNNEST($3::text[]), -- table_name
        UNNEST($4::integer[]), -- object_id
        UNNEST($5::text[]), -- node_type
        UNNEST($6::bool[]), -- is_root
        UNNEST($7::text[]), -- org
        UNNEST($8::text[]), -- dynamic_children
        UNNEST($9::bool[]), -- sql_sort
        UNNEST($10::text[]), -- policy
        UNNEST($11::bool[]), -- derive_permissions_from_class
        UNNEST($12::text[]), -- iconfactory
        UNNEST($13::text[]), -- icon
        UNNEST($14::text[]), -- artificial_id
        UNNEST($15::integer[]) -- id
    ) AS t(n,d,t,oid,nt,ir,o,dc,ss,p,dpc,if,i,aid,tid)
    LEFT OUTER JOIN  cs_class ON (t=cs_class.table_name)
    LEFT OUTER JOIN cs_policy ON (p=cs_policy.name)
;
`;

export const complex_cs_cat_link = `
INSERT INTO cs_cat_link (id_from, id_to, domain_to) 
    SELECT  f,t,cs_domain.id
    FROM ( SELECT
        UNNEST($1::integer[]), -- from
        UNNEST($2::integer[]) -- to
    ) as t(f,t)
    JOIN cs_domain ON (cs_domain.name='LOCAL')
;
`;

export const complex_cs_ug_cat_node_permission = `
INSERT INTO cs_ug_cat_node_perm (ug_id, "domain", cat_node_id, "permission" ) 
    SELECT 
        cs_ug.id uid, node_domain.id, cnid, cs_permission.id pid
    FROM (SELECT 
        UNNEST($1::text[]), -- group name
        UNNEST($2::text[]), -- group domain
        UNNEST($3::integer[]), -- cat_node_id
        UNNEST($4::text[]) -- permission
    )  AS t(g,d,cnid,p)   
   JOIN cs_domain node_domain ON (node_domain.name='LOCAL')
   JOIN cs_domain group_domain ON (d=group_domain.name)
   JOIN cs_ug ON (g=cs_ug.name AND group_domain.id=cs_ug.domain)
   JOIN cs_permission ON (p=cs_permission.key)
;
`;