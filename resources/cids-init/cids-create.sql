-- cs_attr_object

CREATE TABLE cs_attr_object (
    class_id integer NOT NULL,
    object_id integer NOT NULL,
    attr_class_id integer NOT NULL,
    attr_object_id integer NOT NULL
);

CREATE INDEX attr_object_index
  ON cs_attr_object
  USING btree
  (class_id, object_id, attr_class_id, attr_object_id);

-- cs_attr_object_derived

CREATE TABLE cs_attr_object_derived
(
  class_id integer NOT NULL,
  object_id integer NOT NULL,
  attr_class_id integer NOT NULL,
  attr_object_id integer NOT NULL
)
WITH (
  OIDS=FALSE
);

CREATE INDEX attr_object_derived_index
  ON cs_attr_object_derived
  USING btree
  (class_id, object_id, attr_class_id, attr_object_id);

CREATE INDEX attr_object_derived_index_acid_aoid
  ON cs_attr_object_derived
  USING btree
  (attr_class_id, attr_object_id);

CREATE INDEX attr_object_derived_index_cid_oid
  ON cs_attr_object_derived
  USING btree
  (class_id, object_id);

-- cs_attr

CREATE SEQUENCE cs_attr_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_attr (
    id integer DEFAULT NEXTVAL(('cs_attr_sequence'::text)::regclass) NOT NULL,
    class_id integer NOT NULL,
    type_id integer NOT NULL,
    name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    foreign_key BOOLEAN DEFAULT false NOT NULL,
    substitute BOOLEAN DEFAULT false NOT NULL,
    foreign_key_references_to integer,
    descr text,
    visible BOOLEAN DEFAULT true NOT NULL,
    indexed BOOLEAN DEFAULT false NOT NULL,
    isarray BOOLEAN DEFAULT false NOT NULL,
    array_key TEXT,
    editor integer,
    tostring integer,
    complex_editor integer,
    optional BOOLEAN DEFAULT true NOT NULL,
    default_value TEXT,
    from_string integer,
    pos integer DEFAULT 0,
    "precision" integer,
    scale integer,
    extension_attr BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE ONLY cs_attr
    ADD CONSTRAINT x_cs_attr_pkey PRIMARY KEY (id);

-- cs_attr_string

CREATE TABLE cs_attr_string (
    class_id integer NOT NULL,
    attr_id integer NOT NULL,
    object_id integer NOT NULL,
    string_val text NOT NULL
);

CREATE INDEX i_cs_attr_string_aco_id ON cs_attr_string USING btree (attr_id, class_id, object_id);

CREATE INDEX cs_attr_string_class_idx
  ON cs_attr_string
  USING btree
  (class_id);

CREATE INDEX cs_attr_string_object_idx
  ON cs_attr_string
  USING btree
  (object_id);

-- cs_cat_link

CREATE SEQUENCE cs_cat_link_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_cat_link (
    id_from integer NOT NULL,
    id_to integer NOT NULL,
    org text,
    domain_to integer,
    id integer DEFAULT NEXTVAL('cs_cat_link_sequence'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_cat_link
    ADD CONSTRAINT cs_cat_link_pkey PRIMARY KEY (id);

-- cs_cat_node

CREATE SEQUENCE cs_cat_node_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_cat_node (
    id integer DEFAULT NEXTVAL(('cs_cat_node_sequence'::text)::regclass) NOT NULL,
    name TEXT NOT NULL,
    descr integer DEFAULT 1,
    class_id integer,
    object_id integer,
    node_type character(1) DEFAULT 'N'::bpchar NOT NULL,
    is_root BOOLEAN DEFAULT false NOT NULL,
    org text,
    dynamic_children text,
    sql_sort BOOLEAN,
    policy integer,
    derive_permissions_from_class BOOLEAN DEFAULT true,
    iconfactory integer,
    icon TEXT,
    artificial_id TEXT
);

ALTER TABLE ONLY cs_cat_node
    ADD CONSTRAINT x_cs_cat_node_pkey PRIMARY KEY (id);

CREATE INDEX cl_idx ON cs_cat_node USING btree (class_id);

CREATE INDEX ob_idx ON cs_cat_node USING btree (object_id);

CREATE INDEX obj_cl_idx ON cs_cat_node USING btree (class_id, object_id);

-- cs_class

CREATE TABLE cs_class (
    id integer DEFAULT NEXTVAL(('cs_class_sequence'::text)::regclass) NOT NULL,
    name TEXT NOT NULL,
    descr text,
    class_icon_id integer NOT NULL,
    object_icon_id integer NOT NULL,
    table_name TEXT NOT NULL,
    primary_key_field TEXT DEFAULT 'ID'::TEXT NOT NULL,
    indexed BOOLEAN DEFAULT false NOT NULL,
    tostring integer,
    editor integer,
    renderer integer,
    array_link BOOLEAN DEFAULT false NOT NULL,
    policy integer,
    attribute_policy integer
);

CREATE SEQUENCE cs_class_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

ALTER TABLE ONLY cs_class
    ADD CONSTRAINT x_cs_class_name_key UNIQUE (name);

ALTER TABLE ONLY cs_class
    ADD CONSTRAINT x_cs_class_pkey PRIMARY KEY (id);

-- cs_class_attr

CREATE SEQUENCE cs_class_attr_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_class_attr (
    id integer DEFAULT NEXTVAL('cs_class_attr_sequence'::regclass) NOT NULL,
    class_id integer NOT NULL,
    type_id integer NOT NULL,
    attr_key TEXT NOT NULL,
    attr_value text
);

ALTER TABLE ONLY cs_class_attr
    ADD CONSTRAINT cs_class_attr_pkey PRIMARY KEY (id);

-- cs_domain

CREATE SEQUENCE cs_domain_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_domain (
    id integer DEFAULT NEXTVAL('cs_domain_sequence'::regclass) NOT NULL,
    name TEXT
);

ALTER TABLE ONLY cs_domain
    ADD CONSTRAINT cs_domain_pkey PRIMARY KEY (id);

-- cs_icon

CREATE SEQUENCE cs_icon_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_icon (
    id integer DEFAULT NEXTVAL('cs_icon_sequence'::regclass) NOT NULL,
    name TEXT NOT NULL,
    file_name TEXT DEFAULT 'default_icon.gif'::TEXT NOT NULL
);

ALTER TABLE ONLY cs_icon
    ADD CONSTRAINT cs_icon_pkey PRIMARY KEY (id);

-- cs_java_class

CREATE SEQUENCE cs_java_class_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_java_class (
    id integer DEFAULT NEXTVAL('cs_java_class_sequence'::regclass) NOT NULL,
    qualifier TEXT,
    type TEXT DEFAULT 'unknown'::TEXT NOT NULL,
    notice TEXT
);

ALTER TABLE ONLY cs_java_class
    ADD CONSTRAINT cs_java_class_pkey PRIMARY KEY (id);

-- cs_locks

CREATE SEQUENCE cs_locks_seq
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_locks (
    class_id integer,
    object_id integer,
    user_string TEXT,
    additional_info TEXT,
    id integer DEFAULT NEXTVAL('cs_locks_seq'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_locks
    ADD CONSTRAINT cs_locks_pkey PRIMARY KEY (id);

-- cs_method

CREATE SEQUENCE cs_method_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_method (
    id integer DEFAULT NEXTVAL(('cs_method_sequence'::text)::regclass) NOT NULL,
    descr text,
    mult BOOLEAN DEFAULT false NOT NULL,
    class_mult BOOLEAN DEFAULT false NOT NULL,
    plugin_id TEXT DEFAULT ''::TEXT NOT NULL,
    method_id TEXT DEFAULT ''::TEXT NOT NULL
);

ALTER TABLE ONLY cs_method
    ADD CONSTRAINT x_cs_method_pkey PRIMARY KEY (id);

-- cs_method_class_assoc

CREATE SEQUENCE cs_method_class_assoc_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_method_class_assoc (
    class_id integer NOT NULL,
    method_id integer NOT NULL,
    id integer DEFAULT NEXTVAL('cs_method_class_assoc_sequence'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_method_class_assoc
    ADD CONSTRAINT cs_method_class_assoc_pkey PRIMARY KEY (id);

-- cs_permission

CREATE SEQUENCE cs_permission_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_permission (
    id integer DEFAULT NEXTVAL('cs_permission_sequence'::regclass) NOT NULL,
    KEY TEXT,
    description TEXT
);

ALTER TABLE ONLY cs_permission
    ADD CONSTRAINT cs_permission_pkey PRIMARY KEY (id);

-- cs_policy

CREATE SEQUENCE cs_policy_sequence
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_policy (
    id integer DEFAULT NEXTVAL('cs_policy_sequence'::regclass) NOT NULL,
    name TEXT NOT NULL
);

ALTER TABLE ONLY cs_policy
    ADD CONSTRAINT cs_policy_pkey PRIMARY KEY (id);

-- cs_policy_rule

CREATE SEQUENCE cs_policy_rule_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_policy_rule (
    id integer DEFAULT NEXTVAL('cs_policy_rule_sequence'::regclass) NOT NULL,
    policy integer NOT NULL,
    permission integer NOT NULL,
    default_value BOOLEAN NOT NULL
);

ALTER TABLE ONLY cs_policy_rule
    ADD CONSTRAINT cs_policy_rule_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_policy_rule
    ADD CONSTRAINT cs_policy_rule_policy_key UNIQUE (policy, permission);

-- cs_query

CREATE SEQUENCE cs_query_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query (
    id integer DEFAULT NEXTVAL(('cs_query_sequence'::text)::regclass) NOT NULL,
    name TEXT NOT NULL,
    descr text,
    statement text,
    result integer,
    is_update BOOLEAN DEFAULT false NOT NULL,
    is_union BOOLEAN DEFAULT false NOT NULL,
    is_root BOOLEAN DEFAULT false NOT NULL,
    is_batch BOOLEAN DEFAULT false NOT NULL,
    conjunction BOOLEAN DEFAULT false NOT NULL,
    is_search BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE ONLY cs_query
    ADD CONSTRAINT x_cs_query_name_key UNIQUE (name);

ALTER TABLE ONLY cs_query
    ADD CONSTRAINT x_cs_query_pkey PRIMARY KEY (id);

-- cs_query_class_assoc

CREATE SEQUENCE cs_query_class_assoc_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query_class_assoc (
    class_id integer NOT NULL,
    query_id integer NOT NULL,
    id integer DEFAULT NEXTVAL('cs_query_class_assoc_sequence'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_query_class_assoc
    ADD CONSTRAINT cs_query_class_assoc_pkey PRIMARY KEY (id);

-- cs_query_link

CREATE SEQUENCE cs_query_link_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query_link (
    id integer DEFAULT NEXTVAL('cs_query_link_sequence'::regclass) NOT NULL,
    id_from integer NOT NULL,
    id_to integer NOT NULL,
    domain_to integer
);

ALTER TABLE ONLY cs_query_link
    ADD CONSTRAINT cs_query_link_pkey PRIMARY KEY (id);

-- cs_query_parameter

CREATE SEQUENCE cs_query_parameter_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query_parameter (
    id integer DEFAULT NEXTVAL(('cs_query_parameter_sequence'::text)::regclass) NOT NULL,
    query_id integer NOT NULL,
    param_key TEXT NOT NULL,
    descr text,
    is_query_result BOOLEAN DEFAULT false NOT NULL,
    type_id integer,
    query_position integer DEFAULT 0
);

ALTER TABLE ONLY cs_query_parameter
    ADD CONSTRAINT x_cs_query_parameter_pkey PRIMARY KEY (id);

-- cs_query_store

CREATE SEQUENCE cs_query_store_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query_store (
    id integer DEFAULT NEXTVAL('cs_query_store_sequence'::regclass) NOT NULL,
    user_id integer NOT NULL,
    name TEXT NOT NULL,
    file_name TEXT NOT NULL
);

ALTER TABLE ONLY cs_query_store
    ADD CONSTRAINT cs_query_store_pkey PRIMARY KEY (id);

-- cs_query_store_ug

CREATE SEQUENCE cs_query_store_ug_assoc_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query_store_ug_assoc (
    ug_id integer NOT NULL,
    query_store_id integer NOT NULL,
    permission integer,
    domain integer,
    id integer DEFAULT NEXTVAL('cs_query_store_ug_assoc_sequence'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_query_store_ug_assoc
    ADD CONSTRAINT cs_query_store_ug_assoc_pkey PRIMARY KEY (id);

-- cs_query_ug_assoc

CREATE SEQUENCE cs_query_ug_assoc_sequence
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_query_ug_assoc (
    ug_id integer NOT NULL,
    query_id integer NOT NULL,
    permission integer,
    domain integer,
    id integer DEFAULT NEXTVAL('cs_query_ug_assoc_sequence'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_query_ug_assoc
    ADD CONSTRAINT cs_query_ug_assoc_pkey PRIMARY KEY (id);

-- cs_type

CREATE SEQUENCE cs_type_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_type (
    id integer DEFAULT NEXTVAL(('cs_type_sequence'::text)::regclass) NOT NULL,
    name TEXT NOT NULL,
    class_id integer,
    complex_type BOOLEAN DEFAULT false NOT NULL,
    descr text,
    editor integer,
    renderer integer
);

ALTER TABLE ONLY cs_type
    ADD CONSTRAINT x_cs_type_name_key UNIQUE (name);

ALTER TABLE ONLY cs_type
    ADD CONSTRAINT x_cs_type_pkey PRIMARY KEY (id);

-- cs_ug

CREATE SEQUENCE cs_ug_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug (
    id integer DEFAULT NEXTVAL('cs_ug_sequence'::regclass) NOT NULL,
    name TEXT NOT NULL,
    descr text,
    domain integer NOT NULL,
    prio integer NOT NULL,
    UNIQUE ( prio )
);

ALTER TABLE ONLY cs_ug
    ADD CONSTRAINT cs_ug_pkey PRIMARY KEY (id);

-- cs_ug_attr_perm

CREATE SEQUENCE cs_ug_attr_perm_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug_attr_perm (
    id integer DEFAULT NEXTVAL(('cs_ug_attr_perm_sequence'::text)::regclass) NOT NULL,
    ug_id integer NOT NULL,
    attr_id integer NOT NULL,
    permission integer,
    domain integer
);

ALTER TABLE ONLY cs_ug_attr_perm
    ADD CONSTRAINT attr_perm_pkey PRIMARY KEY (id);

-- cs_ug_cat_node

CREATE SEQUENCE cs_ug_cat_node_perm_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug_cat_node_perm (
    id integer DEFAULT NEXTVAL(('cs_ug_cat_node_perm_sequence'::text)::regclass) NOT NULL,
    ug_id integer NOT NULL,
    domain integer,
    cat_node_id integer NOT NULL,
    permission integer
);

ALTER TABLE ONLY cs_ug_cat_node_perm
    ADD CONSTRAINT cat_node_perm_pkey PRIMARY KEY (id);

-- cs_ug_class_perm

CREATE SEQUENCE cs_ug_class_perm_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug_class_perm (
    id integer DEFAULT NEXTVAL('cs_ug_class_perm_sequence'::regclass) NOT NULL,
    ug_id integer NOT NULL,
    class_id integer NOT NULL,
    permission integer,
    domain integer
);

ALTER TABLE ONLY cs_ug_class_perm
    ADD CONSTRAINT class_perm_pkey PRIMARY KEY (id);

-- cs_ug_membership

CREATE SEQUENCE cs_ug_membership_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug_membership (
    ug_id integer NOT NULL,
    usr_id integer NOT NULL,
    ug_domain integer,
    id integer DEFAULT NEXTVAL('cs_ug_membership_sequence'::regclass) NOT NULL
);

ALTER TABLE ONLY cs_ug_membership
    ADD CONSTRAINT cs_ug_membership_pkey PRIMARY KEY (id);

-- cs_ug_method

CREATE SEQUENCE cs_ug_method_perm_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug_method_perm (
    id integer DEFAULT NEXTVAL(('cs_ug_method_perm_sequence'::text)::regclass) NOT NULL,
    ug_id integer NOT NULL,
    domain integer,
    method_id integer NOT NULL,
    permission integer
);

ALTER TABLE ONLY cs_ug_method_perm
    ADD CONSTRAINT method_perm_pkey PRIMARY KEY (id);

-- cs_usr

CREATE SEQUENCE cs_usr_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_usr (
    id integer DEFAULT NEXTVAL(('cs_usr_sequence'::text)::regclass) NOT NULL,
    login_name TEXT NOT NULL,
    password TEXT,
    last_pwd_change timestamp without time zone NOT NULL,
    administrator BOOLEAN DEFAULT false NOT NULL,
    pw_hash char(64),
    salt char(16),
    last_pw_hash char(64),
    last_salt char(16)
);

ALTER TABLE ONLY cs_usr
    ADD CONSTRAINT x_cs_usr_login_name_key UNIQUE (login_name);

ALTER TABLE ONLY cs_usr
    ADD CONSTRAINT x_cs_usr_pkey PRIMARY KEY (id);

-- geom

CREATE SEQUENCE geom_seq MINVALUE 1 START 1;

CREATE TABLE geom
(
    id integer PRIMARY KEY DEFAULT NEXTVAL('geom_seq')
);

SELECT AddGeometryColumn( 'public','geom','geo_field', -1, 'GEOMETRY', 2 );

CREATE INDEX geo_index ON geom USING GIST ( geo_field );

-- url_base

CREATE SEQUENCE url_base_seq MINVALUE 1 START 1;

CREATE TABLE url_base(
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('url_base_seq'),
    prot_prefix TEXT NOT NULL,
    path TEXT NOT NULL,
    server TEXT NOT NULL
);

-- url

CREATE SEQUENCE url_seq MINVALUE 1 START 1;

CREATE TABLE url(
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('url_seq'),
    object_name TEXT NOT NULL,
    url_base_id INTEGER NOT NULL
);

-- cs_config_attr_key

CREATE SEQUENCE cs_config_attr_key_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_key (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_key_sequence'),
    KEY TEXT NOT NULL,
    group_name TEXT NOT NULL
);

-- cs_config_attr_value

CREATE SEQUENCE cs_config_attr_value_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_value (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_value_sequence'),
    value TEXT );

-- cs_config_attr_type

CREATE SEQUENCE cs_config_attr_type_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_type (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_type_sequence'),
    type char(1) NOT NULL,
    descr TEXT );

-- cs_config_attr_jt

CREATE SEQUENCE cs_config_attr_jt_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_jt (
    id      INTEGER       PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_jt_sequence'),
    usr_id  INTEGER,
    ug_id   INTEGER,
    dom_id  INTEGER       NOT NULL,
    key_id  INTEGER       NOT NULL,
    val_id  INTEGER       NOT NULL,
    -- type is only for editing purposes, determines which editor is suited best
    type_id INTEGER,
    FOREIGN KEY (usr_id)  REFERENCES cs_usr,
    FOREIGN KEY (ug_id)   REFERENCES cs_ug,
    FOREIGN KEY (dom_id)  REFERENCES cs_domain,
    FOREIGN KEY (key_id)  REFERENCES cs_config_attr_key,
    FOREIGN KEY (val_id)  REFERENCES cs_config_attr_value,
    FOREIGN KEY (type_id) REFERENCES cs_config_attr_type,
    -- NULL != NULL in this case so don't fully rely on that
    UNIQUE ( usr_id, ug_id, dom_id, key_id)
);

-- cs_config_attr_exempt

CREATE SEQUENCE cs_config_attr_exempt_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_exempt (
    id     INTEGER       PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_exempt_sequence'),
    usr_id INTEGER       NOT NULL,
    key_id INTEGER,
    ug_id  INTEGER       NOT NULL,
    FOREIGN KEY (usr_id)  REFERENCES cs_usr,
    FOREIGN KEY (key_id)  REFERENCES cs_config_attr_key,
    FOREIGN KEY (ug_id)   REFERENCES cs_ug,
    UNIQUE ( usr_id, key_id )
);

-- cs_changed

CREATE TABLE cs_changed
(
  class_id integer NOT NULL,
  object_id integer NOT NULL,
  "time" timestamp with time zone DEFAULT now(),
  CONSTRAINT cs_changed_primary_key PRIMARY KEY (class_id, object_id)
);

-- cs_scheduled_serveractions

CREATE SEQUENCE cs_scheduled_serveractions_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_scheduled_serveractions (
  id integer NOT NULL DEFAULT nextval(('cs_scheduled_serveractions_sequence'::text)::regclass),
  key TEXT,
  params_json TEXT,
  body_json TEXT,
  start_timestamp timestamp without time zone,
  execution_rule TEXT,
  execution_timestamp timestamp without time zone,
  result_json TEXT,
  aborted boolean,
  taskname TEXT,
  username TEXT,
  groupname TEXT,
  CONSTRAINT cs_scheduled_serveractions_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

-- cs_history

CREATE TABLE cs_history (
    class_id    INTEGER     NOT NULL,
    object_id   INTEGER     NOT NULL,
 -- because of anonymous usage null must be allowed
    usr_id      INTEGER             ,
 -- because of anonymous usage null must be allowed
    ug_id       INTEGER             ,
    valid_from  TIMESTAMP   NOT NULL,
    json_data   TEXT        NOT NULL,

    FOREIGN KEY (class_id)  REFERENCES cs_class,
    FOREIGN KEY (usr_id)    REFERENCES cs_usr,
    FOREIGN KEY (ug_id)     REFERENCES cs_ug,

    PRIMARY KEY (class_id, object_id, valid_from)
);

-- cs_cache

CREATE TABLE cs_cache
(
  class_id integer NOT NULL,
  object_id integer NOT NULL,
  stringrep TEXT,
  lightweight_json text,
  CONSTRAINT cid_oid PRIMARY KEY (class_id , object_id )
)
WITH (
  OIDS=FALSE
);

-- cs_dynamic_children_helper

CREATE SEQUENCE cs_dynamic_children_helper_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_dynamic_children_helper
(
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_dynamic_children_helper_sequence'),
    name text,
    code text
)
WITH (
  OIDS=FALSE
);

--- suche

--- views die von der suche gebraucht werden

CREATE
    VIEW textsearch
    (
        class_id,
        object_id,
        name,
        string_val
    ) AS
SELECT DISTINCT
    x.class_id,
    x.object_id,
    c.name,
    x.string_val
FROM
    (cs_attr_string x
LEFT JOIN
    cs_cat_node c
    ON
    (
        (
            (
                x.class_id = c.class_id
            )
            AND
            (
                x.object_id = c.object_id
            )
        )
    )
    )
ORDER BY
    x.class_id,
    x.object_id,
    c.name,
    x.string_val;


CREATE
    VIEW geosuche
    (
        class_id,
        object_id,
        name,
        geo_field
    ) AS
SELECT DISTINCT
    x.class_id,
    x.object_id,
    c.name,
    x.geo_field
FROM
    (
        (
        SELECT DISTINCT
            cs_attr_object.class_id,
            cs_attr_object.object_id,
            geom.geo_field
        FROM
            geom,
            cs_attr_object
        WHERE
            (
                (
                    cs_attr_object.attr_class_id = (SELECT id FROM cs_class WHERE table_name = 'GEOM')
                )
                AND
                (
                    cs_attr_object.attr_object_id = geom.id
                )
            )
        ORDER BY
            cs_attr_object.class_id,
            cs_attr_object.object_id,
            geom.geo_field
        )
        x
    LEFT JOIN
        cs_cat_node c
        ON
        (
            (
                (
                    x.class_id = c.class_id
                )
                AND
                (
                    x.object_id = c.object_id
                )
            )
        )
    )
ORDER BY
    x.class_id,
    x.object_id,
    c.name,
    x.geo_field;


CREATE VIEW cs_class_hierarchy AS 
 SELECT father_child.father, father_child.child
   FROM ( SELECT a.foreign_key_references_to AS child, a.class_id AS father, c.primary_key_field AS pk, c.table_name, a.field_name, a.isarray
           FROM cs_attr a, cs_class c
          WHERE a.foreign_key = true AND a.class_id = c.id AND a.indexed = true) father_child;


-- new tables depend on several other constraints thus they are created last

select addgeometrycolumn(''::TEXT, 'public'::TEXT,'cs_cache'::TEXT,'geometry'::TEXT, -1,'GEOMETRY'::TEXT,2);

CREATE OR REPLACE FUNCTION insert_cache_entry(classid integer, objectId integer)
  RETURNS void AS
'
begin
    BEGIN
        EXECUTE ''INSERT into cs_cache (class_id,object_id,''|| fields.attr_value ||'') select ''||packer.class_id||'',''||packer.attr_value || 
               CASE WHEN packer.attr_value ilike ''%where%'' THEN '' AND '' ELSE '' where '' END || cs_class.table_name || ''.id''||''=''||  objectId 
        FROM    cs_class_attr fields, 
            cs_class_attr packer, 
            cs_class 
        where   fields.class_id=packer.class_id and 
            fields.attr_key=''caching'' and 
            packer.attr_key=''cachepacker'' and 
            fields.class_id=cs_class.id and 
            cs_Class.id=classId;
    END;
end
'
  LANGUAGE plpgsql VOLATILE
  COST 100;


--start: create the postgres 9 or postgres 10 version of the update_cache_entry function

CREATE OR REPLACE FUNCTION public.createFunction(
	_command TEXT)
    RETURNS TEXT
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$

DECLARE _r int;
BEGIN
EXECUTE _command;
    RETURN 'Yes: ' || _command || ' executed';
EXCEPTION
    WHEN OTHERS THEN
    RETURN 'No:  ' || _command || ' failed';
END;

$BODY$;
  

select case when substring(version(), position(' ' in version()) + 1,  (position('.' in version()) - position(' ' in version()) - 1) )::integer < 10 then
createFunction('CREATE OR REPLACE FUNCTION update_cache_entry(classid integer, objectId integer)
  RETURNS void AS
''
begin
    declare
        affectedRows INTEGER;
    BEGIN
        execute ''''UPDATE cs_cache SET (''''|| fields.attr_value ||'''')=(''''||''''f.''''||replace(fields.attr_value,'''','''','''',f.'''')||'''') FROM  (SELECT ''''||packer.attr_value || 
        CASE WHEN packer.attr_value ilike ''''%where%'''' THEN '''' AND '''' ELSE '''' where '''' END || cs_class.table_name || ''''.id'''' ||''''=''''|| objectid ||'''') AS f(id,''''|| fields.attr_value ||'''') WHERE class_id=''''||fields.class_id||''''  AND object_id=''''|| objectid 
        FROM    cs_class_attr fields,
            cs_class_attr packer,     
            cs_class 
        WHERE   fields.class_id=packer.class_id  AND 
            fields.attr_key=''''caching'''' AND 
            packer.attr_key=''''cachepacker'''' AND 
            fields.class_id=cs_class.id AND 
            cs_class.id=classid;
        GET DIAGNOSTICS affectedRows = ROW_COUNT;
        if affectedRows = 0 then
            raise exception ''''no row affected by the update statement'''';
        end if;
    END;
end
''
  LANGUAGE plpgsql VOLATILE
  COST 100;'::text)
else 
createFunction ('CREATE OR REPLACE FUNCTION update_cache_entry(classid integer, objectId integer)
  RETURNS void AS
''
begin
    declare
        affectedRows INTEGER;
    BEGIN
        execute ''''UPDATE cs_cache SET (''''|| fields.attr_value ||'''')=ROW(''''||''''f.''''||replace(fields.attr_value,'''','''','''',f.'''')||'''') FROM  (SELECT ''''||packer.attr_value || 
        CASE WHEN packer.attr_value ilike ''''%where%'''' THEN '''' AND '''' ELSE '''' where '''' END || cs_class.table_name || ''''.id'''' ||''''=''''|| objectid ||'''') AS f(id,''''|| fields.attr_value ||'''') WHERE class_id=''''||fields.class_id||''''  AND object_id=''''|| objectid 
        FROM    cs_class_attr fields,
            cs_class_attr packer,     
            cs_class 
        WHERE   fields.class_id=packer.class_id  AND 
            fields.attr_key=''''caching'''' AND 
            packer.attr_key=''''cachepacker'''' AND 
            fields.class_id=cs_class.id AND 
            cs_class.id=classid;
        GET DIAGNOSTICS affectedRows = ROW_COUNT;
        if affectedRows = 0 then
            raise exception ''''no row affected by the update statement'''';
        end if;
    END;
end
''
  LANGUAGE plpgsql VOLATILE
  COST 100;'::text)

end;

DROP FUNCTION createFunction(TEXT);

--end: create the postgres 9 or postgres 10 version of the update_cache_entry function


CREATE OR REPLACE FUNCTION recreate_cache()
  RETURNS void AS
'
declare
    ids INTEGER;
begin
    FOR ids IN SELECT c.id FROM cs_class c, cs_class_attr a where c.id = a.class_id and a.attr_key=''cachepacker'' LOOP
        RAISE NOTICE ''reindex %'', ids;
        PERFORM recreate_cache(ids);
    END LOOP;
end
'
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION recreate_cache(classid integer)
  RETURNS void AS
'
begin
    BEGIN
        delete from cs_cache where class_id = classid;
        execute ''insert into cs_cache (class_id,object_id,''|| fields.attr_value ||'') select ''||packer.class_id||'',''||packer.attr_value FROM cs_class_attr fields,
        cs_class_attr packer WHERE fields.class_id=packer.class_id AND fields.attr_key=''caching'' AND packer.attr_key=''cachepacker'' and fields.class_id = classid;
    EXCEPTION WHEN SYNTAX_ERROR_OR_ACCESS_RULE_VIOLATION OR DATA_EXCEPTION OR PROGRAM_LIMIT_EXCEEDED THEN
        RAISE WARNING ''Error occurs while recreating the cache for class %.'', classid;
        RAISE WARNING ''% %'', SQLERRM, SQLSTATE;
        RETURN;
    END;
end
'
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION recreate_cache(tablename text)
  RETURNS void AS
'
begin
declare
    classId INTEGER;
    BEGIN
        select id into classId from cs_class where lower(table_name) = lower(tablename);
        if classId is not null then
            perform recreate_cache(classId) from cs_class where lower(table_name) = lower(tablename);
        else
            raise exception ''table % not found'', tablename;
        end if;
    END;
end
'
  LANGUAGE plpgsql VOLATILE
  COST 100;



CREATE OR REPLACE FUNCTION insert_cache_entry(tableName text, objectId integer)
  RETURNS void AS
'
begin
declare
    classId INTEGER;
    BEGIN
        select id into classId from cs_class where lower(table_name) = lower(tablename);
        if classId is not null then
            perform insert_cache_entry(classId, objectId) from cs_class where lower(table_name) = lower(tablename);
        else
            raise exception ''table % not found'', tablename;
        end if;
    END;
end
'
  LANGUAGE plpgsql VOLATILE
  COST 100;



CREATE OR REPLACE FUNCTION update_cache_entry(tableName text, objectId integer)
  RETURNS void AS
'
begin
declare
    classId INTEGER;
    BEGIN
        select id into classId from cs_class where lower(table_name) = lower(tablename);
        if classId is not null then
            perform update_cache_entry(classId, objectId) from cs_class where lower(table_name) = lower(tablename);
        else
            raise exception ''table % not found'', tablename;
        end if;
    END;
end
'
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION reindexpure(classid integer)
  RETURNS void AS
$BODY$
declare
	attr cs_attr%ROWTYPE;
	obj RECORD;
	ids RECORD;
	objects RECORD;
	class cs_class%ROWTYPE;
	query TEXT;
	secQuery TEXT;
	attrClass cs_class%ROWTYPE;
	attrFieldName TEXT;
	objectCount INTEGER;
	foreignFieldName TEXT;
	backreference TEXT;
	
begin
	CREATE TEMP TABLE cs_attr_object_temp (class_id integer, object_id integer, attr_class_id integer, attr_object_id integer);
	CREATE TEMP TABLE cs_attr_string_temp (class_id integer, attr_id integer, object_id integer, string_val text);
	
	SELECT * INTO class FROM cs_class WHERE id = classId;

	FOR attr IN SELECT * FROM cs_attr WHERE class_id = classId LOOP	
		--RAISE NOTICE '%     %', attr.field_name, class.table_name ;
		IF attr.indexed THEN
			IF attr.foreign_key_references_to < 0 THEN
				query = 'SELECT ' || class.primary_key_field || ' AS pField, cast(' ||  class.primary_key_field || ' as text) AS fName FROM ' || class.table_name;
			ELSE
				query = 'SELECT ' || class.primary_key_field || ' AS pField, cast(' ||  attr.field_name || ' as text) AS fName FROM ' || class.table_name;
			END IF;
			FOR obj IN EXECUTE query LOOP
				IF attr.foreign_key THEN
					SELECT cs_class.* INTO attrClass FROM cs_class, cs_type WHERE cs_type.class_id = cs_class.id AND cs_type.id = attr.type_id;
					IF attr.foreign_key_references_to < 0 THEN
						select field_name into backreference from cs_attr where class_id = abs(attr.foreign_key_references_to) and foreign_key_references_to = attr.class_id limit 1;
						secQuery = 'SELECT id as id FROM ' || attrClass.table_name || ' WHERE ' || backreference  || ' =  ' || obj.pField;
						FOR ids IN EXECUTE secQuery LOOP
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrClass.id, ids.id);
						END LOOP;
					ELSEIF attrClass.array_link THEN
						secQuery = 'SELECT id as id FROM ' || attrClass.table_name || ' WHERE ' || attr.array_key  || ' =  ' || obj.pField;
						FOR ids IN EXECUTE secQuery LOOP
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrClass.id, ids.id);
						END LOOP;
					ELSE
						secQuery = 'select ' || class.table_name || '.' || attr.field_name || ' as fieldName from ' || class.table_name || ', ' || attrclass.table_name || ' WHERE ' || class.table_name || '.' || class.primary_key_field || ' = ' || obj.pField || ' AND ' || class.table_name || '.' || attr.field_name || ' = ' || attrClass.table_name || '.' || attrClass.primary_key_field;
						EXECUTE secQuery into objects;
						GET DIAGNOSTICS objectCount = ROW_COUNT;
						IF objectCount = 1 THEN
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrClass.id, objects.fieldName);
						ELSE
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrclass.id, -1);
						END IF;
					END IF;
				ELSE 
					IF obj.fName is not null THEN
						INSERT INTO cs_attr_string_temp (class_id, attr_id, object_id, string_val) VALUES (classId, attr.id, obj.pField, obj.fName);
					END IF;
				END IF;
			END LOOP;
		END IF;
	END LOOP;

	DELETE FROM cs_attr_object WHERE class_id = class.id;
	DELETE FROM cs_attr_string WHERE class_id = class.id;
	INSERT INTO cs_attr_object ( class_id, object_id, attr_class_id, attr_object_id) (SELECT class_id, object_id, attr_class_id, attr_object_id FROM cs_attr_object_temp);
	INSERT INTO cs_attr_string ( class_id, attr_id, object_id, string_val) (SELECT class_id, attr_id, object_id, string_val FROM cs_attr_string_temp);
	DROP TABLE cs_attr_object_temp;
	DROP TABLE cs_attr_string_temp;
	
end
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION reindexderivedobjects(classid integer)
  RETURNS void AS
$BODY$
declare
	ids INTEGER;
begin
	CREATE TEMP TABLE cs_attr_object_derived_temp (class_id integer, object_id integer, attr_class_id integer, attr_object_id integer);
	INSERT INTO   cs_attr_object_derived_temp WITH recursive derived_index
	       (
		      xocid,
		      xoid ,
		      ocid ,
		      oid  ,
		      acid ,
		      aid  ,
		      depth
	       )
	       AS
	       ( SELECT class_id,
		       object_id,
		       class_id ,
		       object_id,
		       class_id ,
		       object_id,
		       0
	       FROM    cs_attr_object
	       WHERE   class_id=classId
	       
	       UNION ALL
	       
	       SELECT di.xocid          ,
		      di.xoid           ,
		      aam.class_id      ,
		      aam.object_id     ,
		      aam.attr_class_id ,
		      aam.attr_object_id,
		      di.depth+1
	       FROM   cs_attr_object aam,
		      derived_index di
	       WHERE  aam.class_id =di.acid
	       AND    aam.object_id=di.aid
	       )
	SELECT DISTINCT xocid,
			xoid ,
			acid ,
			aid
	FROM            derived_index
	ORDER BY        1,2,3,4 limit 1000000000;
	DELETE FROM cs_attr_object_derived WHERE class_id = classid;
	INSERT INTO cs_attr_object_derived ( class_id, object_id, attr_class_id, attr_object_id) (SELECT class_id, object_id, attr_class_id, attr_object_id FROM cs_attr_object_derived_temp);
	DROP TABLE cs_attr_object_derived_temp;
end
$BODY$
  LANGUAGE 'plpgsql' VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION "reindex"()
  RETURNS void AS
$BODY$
declare
	ids INTEGER;
begin
	delete from cs_attr_object;
	delete from cs_attr_string;
	delete from cs_attr_object_derived;

	FOR ids IN SELECT id FROM cs_class LOOP
		RAISE NOTICE 'reindex %', ids;
		PERFORM reindexPure(ids);
	END LOOP;

	FOR ids IN SELECT id FROM cs_class where indexed LOOP
		RAISE NOTICE 'reindexDerived %', ids;
		PERFORM reindexDerivedObjects(ids);
	END LOOP;
end
$BODY$
  LANGUAGE 'plpgsql' VOLATILE
  COST 100;



CREATE OR REPLACE FUNCTION reindex(class_id integer)
  RETURNS void AS
$BODY$
declare
	ids INTEGER;
begin
	FOR ids IN WITH recursive derived_child(father,child,depth) AS
                    ( SELECT father,
                            father ,
                            0
                    FROM    cs_class_hierarchy
                    WHERE   father IN (class_id)
                    
                    UNION ALL
                    
                    SELECT ch.father,
                           abs(ch.child) ,
                           dc.depth+1
                    FROM   derived_child dc,
                           cs_class_hierarchy ch
                    WHERE  ch.father=dc.child
                    )
             SELECT DISTINCT child
             FROM            derived_child LIMIT 100 LOOP
		RAISE NOTICE 'reindex  %', abs(ids) ;
		PERFORM reindexPure(abs(ids));
	END LOOP;

	FOR ids IN WITH recursive derived_child(father,child,depth) AS
                    ( SELECT father,
                            father ,
                            0
                    FROM    cs_class_hierarchy
                    WHERE   father IN (class_id)
                    
                    UNION ALL
                    
                    SELECT ch.father,
                           abs(ch.child) ,
                           dc.depth+1
                    FROM   derived_child dc,
                           cs_class_hierarchy ch
                    WHERE  ch.father=dc.child
                    )
             SELECT DISTINCT child
             FROM            derived_child dc join cs_class cc on (cc.id = dc.child) where cc.indexed LIMIT 100 LOOP
		RAISE NOTICE 'reindexDerivedObjects  %', abs(ids) ;
		PERFORM reindexDerivedObjects(abs(ids));
	END LOOP;
end
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;



CREATE OR REPLACE FUNCTION reindexpure(classid integer, objectid integer)
  RETURNS void AS
$BODY$
declare
	attr cs_attr%ROWTYPE;
	obj RECORD;
	ids RECORD;
	objects RECORD;
	class cs_class%ROWTYPE;
	query TEXT;
	secQuery TEXT;
	attrClass cs_class%ROWTYPE;
	attrFieldName TEXT;
	objectCount INTEGER;
	foreignFieldName TEXT;
	backreference TEXT;
	
begin
	CREATE TEMP TABLE cs_attr_object_temp (class_id integer, object_id integer, attr_class_id integer, attr_object_id integer);
	CREATE TEMP TABLE cs_attr_string_temp (class_id integer, attr_id integer, object_id integer, string_val text);
	
	SELECT * INTO class FROM cs_class WHERE id = classId;

	FOR attr IN SELECT * FROM cs_attr WHERE class_id = classId LOOP	
		--RAISE NOTICE '%     %', attr.field_name, class.table_name ;
		IF attr.indexed THEN
			IF attr.foreign_key_references_to < 0 THEN
				query = 'SELECT ' || class.primary_key_field || ' AS pField, cast(' ||  class.primary_key_field || ' as text) AS fName FROM ' || class.table_name || ' where id = ' || objectid;
			ELSE
				query = 'SELECT ' || class.primary_key_field || ' AS pField, cast(' ||  attr.field_name || ' as text) AS fName FROM ' || class.table_name || ' where id = ' || objectid;
			END IF;
			FOR obj IN EXECUTE query LOOP
				IF attr.foreign_key THEN
					SELECT cs_class.* INTO attrClass FROM cs_class, cs_type WHERE cs_type.class_id = cs_class.id AND cs_type.id = attr.type_id;
					IF attr.foreign_key_references_to < 0 THEN
						select field_name into backreference from cs_attr where class_id = abs(attr.foreign_key_references_to) and foreign_key_references_to = attr.class_id;
						secQuery = 'SELECT id as id FROM ' || attrClass.table_name || ' WHERE ' || backreference  || ' =  ' || obj.pField;
						FOR ids IN EXECUTE secQuery LOOP
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrClass.id, ids.id);
						END LOOP;
					ELSEIF attrClass.array_link THEN
						secQuery = 'SELECT id as id FROM ' || attrClass.table_name || ' WHERE ' || attr.array_key  || ' =  ' || obj.pField;
						FOR ids IN EXECUTE secQuery LOOP
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrClass.id, ids.id);
						END LOOP;
					ELSE
						secQuery = 'select ' || class.table_name || '.' || attr.field_name || ' as fieldName from ' || class.table_name || ', ' || attrclass.table_name || ' WHERE ' || class.table_name || '.' || class.primary_key_field || ' = ' || obj.pField || ' AND ' || class.table_name || '.' || attr.field_name || ' = ' || attrClass.table_name || '.' || attrClass.primary_key_field;
						EXECUTE secQuery into objects;
						GET DIAGNOSTICS objectCount = ROW_COUNT;
						IF objectCount = 1 THEN
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrClass.id, objects.fieldName);
						ELSE
							insert into cs_attr_object_temp (class_id, object_id, attr_class_id, attr_object_id) values (class.id, obj.pField, attrclass.id, -1);
						END IF;
					END IF;
				ELSE 
					IF obj.fName is not null THEN
						INSERT INTO cs_attr_string_temp (class_id, attr_id, object_id, string_val) VALUES (classId, attr.id, obj.pField, obj.fName);
					END IF;
				END IF;
			END LOOP;
		END IF;
	END LOOP;

	DELETE FROM cs_attr_object WHERE class_id = class.id and object_id = objectid;
	DELETE FROM cs_attr_string WHERE class_id = class.id and object_id = objectid;
	INSERT INTO cs_attr_object ( class_id, object_id, attr_class_id, attr_object_id) (SELECT class_id, object_id, attr_class_id, attr_object_id FROM cs_attr_object_temp);
	INSERT INTO cs_attr_string ( class_id, attr_id, object_id, string_val) (SELECT class_id, attr_id, object_id, string_val FROM cs_attr_string_temp);
	DROP TABLE cs_attr_object_temp;
	DROP TABLE cs_attr_string_temp;
	
end
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

--- Funktion zur SALT Erzeugung
CREATE OR REPLACE FUNCTION salt(integer) RETURNS text
    AS '(SELECT array_to_string(array 
       ( 
              SELECT substr(''abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'', trunc(random() * 62)::INTEGER + 1, 1)
              FROM   generate_series(1, $1)), ''''))'
    LANGUAGE SQL
    VOLATILE
    RETURNS NULL ON NULL INPUT;

--- Trigger-Funktion, die den Password-Hash aus dem Passwort erzeugt und das Passwort unkenntlich macht
CREATE OR REPLACE FUNCTION set_pw()
  RETURNS trigger AS
'    
BEGIN
   IF TG_OP = ''INSERT'' THEN
       NEW.salt = salt(16);
       NEW.pw_hash = md5(NEW.salt || NEW.password);
       NEW.password = ''*****'';
       NEW.last_pwd_change = now();
   elsif NEW.password IS NOT NULL and NEW.password <> OLD.password then
       NEW.salt = salt(16);
       NEW.pw_hash = md5(NEW.salt || NEW.password);
       NEW.password = ''*****'';
       NEW.last_pwd_change = now();
   END IF;
   RETURN NEW;
END;
'
  LANGUAGE plpgsql VOLATILE
  COST 100;

--- Trigger, der die Trigger-Funktion benutzt, wenn cs_usr geaendert wird
CREATE TRIGGER password_trigger BEFORE INSERT OR UPDATE ON cs_usr FOR EACH ROW EXECUTE PROCEDURE set_pw();

CREATE OR REPLACE FUNCTION cidsObjectExists(cid integer, oid integer)
  RETURNS boolean AS
$BODY$
declare
    b boolean;
    table_name TEXT;
    pk_field TEXT;
    s1 TEXT;
    s2 TEXT;
begin   
    s1='select table_name,primary_key_field from cs_class where id='||cid;
    execute(s1) into table_name,pk_field;
    --raise NOTICE 'tablename:%', table_name;
    --raise NOTICE 'pk:%', pk_field;


    s2='select count(*)>0 from '||table_name ||' where ' || pk_field || '='||oid;
    execute(s2) into b;

    --raise NOTICE '%', s1;
    --raise NOTICE '%', s2;

    return b;
exception
    when OTHERS THEN
    return false;
end
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

CREATE OR REPLACE FUNCTION execute(_command TEXT)
  RETURNS TEXT AS
$BODY$
DECLARE _r int;
BEGIN
EXECUTE _command;
    RETURN 'Yes: ' || _command || ' executed';
EXCEPTION
    WHEN OTHERS THEN
    RETURN 'No:  ' || _command || ' failed';
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION selexecute(_command TEXT)
  RETURNS SETOF record AS
$BODY$
DECLARE _r record;
BEGIN
for _R in EXECUTE _command  loop
    return next _r;
    end loop;
    RETURN;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;

CREATE OR REPLACE FUNCTION execute_query(_command TEXT)
  RETURNS refcursor as 
  $BODY$
DECLARE 
  curs1 refcursor;
BEGIN
  OPEN curs1 FOR EXECUTE _command;
  return curs1;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  COST 100;

CREATE OR REPLACE FUNCTION public.cs_refresh_changed()
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE
AS $BODY$
DECLARE
   ref Record;
BEGIN

	for ref in select id  from cs_class LOOP
		raise notice 'check class %', ref.id;
		perform cs_refresh_changed(ref.id);
	end LOOP;
END;
$BODY$;

CREATE OR REPLACE FUNCTION public.cs_refresh_changed(classId integer)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE
AS $BODY$
DECLARE
   ref Record;
   c integer;
   t timestamp;
   oid integer;
   oidArray integer[];
   queryToExecute text;
BEGIN
	--delete all objects from the cs_changed table, if this class should not be monitored
	if not exists (select 1 from cs_class c join cs_class_attr a on (a.class_id = c.id) where attr_key ilike 'class_changed_monitoring_level' and (attr_value ilike 'class' or attr_value ilike 'object') and c.id = classId) then
		delete from cs_changed where class_id = classId;
	end if;

	for ref in select c.id as class_id, c.table_name, a.attr_value from cs_class c join cs_class_attr a on (a.class_id = c.id) where attr_key ilike 'class_changed_monitoring_level' and c.id = classId LOOP
		if ref.attr_value ilike 'object' then
			select max(time), count(*) into t, c from cs_changed where class_id = ref.class_id;
			
			if c is not null and c = 1 then
				select object_id into oid from cs_changed where class_id = ref.class_id;
				
				if oid = 0 then
					delete from cs_changed where class_id = ref.class_id;
					queryToExecute = 'insert into cs_changed (class_id, object_id, "time") (select ' || ref.class_id || ', id, ''' || t || ''' from ' || ref.table_name || ');';
--					raise notice 'queryToExecute1 %', queryToExecute;
					execute queryToExecute;
				else 
					queryToExecute = 'insert into cs_changed (class_id, object_id) (select ' || ref.class_id || ', id from ' || ref.table_name || ' where id <> ' || oid || ');';
--					raise notice 'queryToExecute2 %', queryToExecute;
					execute queryToExecute;
				end if;
			elsif c is null or c = 0 then
				queryToExecute = 'insert into cs_changed (class_id, object_id) (select ' || ref.class_id || ', id from ' || ref.table_name || ');';
--				raise notice 'queryToExecute3 %', queryToExecute;
				execute queryToExecute;
			else 
				--there is more than one object from the given class
				--remove the entry for the class, if one exists and add the missing entries
				delete from cs_changed where class_id = ref.class_id and object_id = 0;
				select array_agg(object_id) into oidArray from cs_changed where class_id = ref.class_id;
				
				queryToExecute = 'insert into cs_changed (class_id, object_id) (select ' || ref.class_id || ', id from ' || ref.table_name || ' where not (id = any (ARRAY[' || array_to_string(oidArray, ',') || '])));';
--				raise notice 'queryToExecute4 %', queryToExecute;
				execute queryToExecute;
			end if;
		elsif ref.attr_value ilike 'class' then
			select max(time), count(*) into t, c from cs_changed where class_id = ref.class_id;
			
			if c is not null and c = 1 then
				update cs_changed set object_id = 0 where class_id = ref.class_id;
			elsif c is null or c = 0 then
				insert into cs_changed (class_id, object_id) values (ref.class_id, 0);
			else 
				--there is more than one object from the given class
				delete from cs_changed where class_id = ref.class_id;
				insert into cs_changed (class_id, object_id, time) values (ref.class_id, 0, t);
			end if;
		end if;
	end LOOP;
END;
$BODY$;

-- DROP FUNCTION cs_recreatecacheddaqview(text);

CREATE OR REPLACE FUNCTION cs_recreatecacheddaqview(viewname text)
  RETURNS void AS
$BODY$
declare
	e boolean;
begin
	execute 'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE  table_schema = ''daq'' AND table_name   = ''' || viewName || '_cached'')' into e;

	if (e is not null and e) then
		execute 'insert into daq.' || viewName || '_cached (md5, json, time, version, status) (select md5(json) as md5, json as json, now() as refreshed, ''version''::text as version, null::text from daq.' || viewName || ')';
	else 
		execute 'create table daq.' || viewName || '_cached as select json as json,md5(json) as md5, now() as time, ''version''::text as version, null::text as status from daq.' || viewName;
	end if;
end
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- execute()
CREATE OR REPLACE FUNCTION execute(_command character varying)
  RETURNS character varying AS
$BODY$
DECLARE _r int;
BEGIN
EXECUTE _command;
    RETURN 'Yes: ' || _command || ' executed';
EXCEPTION
    WHEN OTHERS THEN
    RETURN 'No:  ' || _command || ' failed';
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- cs_refresh_dynchilds_functions()
CREATE OR REPLACE FUNCTION cs_refresh_dynchilds_functions()
  RETURNS character varying AS
$BODY$
DECLARE
   dropBackupSchema boolean;
   renameSchema boolean;
BEGIN
SELECT EXISTS(SELECT * FROM information_schema.schemata WHERE schema_name = 'csdc_backup') INTO dropBackupSchema;
SELECT EXISTS(SELECT * FROM information_schema.schemata WHERE schema_name = 'csdc') INTO renameSchema;
IF dropBackupSchema THEN
	drop schema csdc_backup cascade;
END IF;
IF renameSchema THEN
    ALTER SCHEMA csdc RENAME TO csdc_backup;
END IF;

create schema csdc;
perform execute('CREATE OR REPLACE FUNCTION csdc.'||name||' RETURNS VARCHAR AS $$ select'''||regexp_replace(replace(code,'''',''''''),'(.*?)<ds::param.*>(.*?)</ds::param>(.*?)',E'\\1''||$\\2||''\\3','g')||'''::varchar $$ LANGUAGE ''sql'';') from cs_dynamic_children_helper;
    RETURN 'Functions refreshed';
EXCEPTION
    WHEN OTHERS THEN
    RETURN 'Error occured';
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;