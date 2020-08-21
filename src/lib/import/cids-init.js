const sql = `CREATE TABLE cs_attr (
    id integer DEFAULT NEXTVAL(('cs_attr_sequence'::text)::regclass) NOT NULL,
    class_id integer NOT NULL,
    type_id integer NOT NULL,
    name character varying(150) NOT NULL,
    field_name character varying(50) NOT NULL,
    foreign_key BOOLEAN DEFAULT false NOT NULL,
    substitute BOOLEAN DEFAULT false NOT NULL,
    foreign_key_references_to integer,
    descr text,
    visible BOOLEAN DEFAULT true NOT NULL,
    indexed BOOLEAN DEFAULT false NOT NULL,
    isarray BOOLEAN DEFAULT false NOT NULL,
    array_key character varying(30),
    editor integer,
    tostring integer,
    complex_editor integer,
    optional BOOLEAN DEFAULT true NOT NULL,
    default_value character varying(100),
    from_string integer,
    pos integer DEFAULT 0,
    "precision" integer,
    scale integer,
    extension_attr BOOLEAN DEFAULT false NOT NULL
);

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

CREATE TABLE cs_cat_node (
    id integer DEFAULT NEXTVAL(('cs_cat_node_sequence'::text)::regclass) NOT NULL,
    name character varying(100) NOT NULL,
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
    icon character varying(512),
    artificial_id varchar(200)
);

CREATE TABLE cs_class (
    id integer DEFAULT NEXTVAL(('cs_class_sequence'::text)::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    descr text,
    class_icon_id integer NOT NULL,
    object_icon_id integer NOT NULL,
    table_name character varying(100) NOT NULL,
    primary_key_field character varying(100) DEFAULT 'ID'::character varying NOT NULL,
    indexed BOOLEAN DEFAULT false NOT NULL,
    tostring integer,
    editor integer,
    renderer integer,
    array_link BOOLEAN DEFAULT false NOT NULL,
    policy integer,
    attribute_policy integer
);

CREATE SEQUENCE cs_class_attr_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_class_attr (
    id integer DEFAULT NEXTVAL('cs_class_attr_sequence'::regclass) NOT NULL,
    class_id integer NOT NULL,
    type_id integer NOT NULL,
    attr_key character varying(100) NOT NULL,
    attr_value text
);

CREATE SEQUENCE cs_domain_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_domain (
    id integer DEFAULT NEXTVAL('cs_domain_sequence'::regclass) NOT NULL,
    name character varying(30)
);

CREATE SEQUENCE cs_icon_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_icon (
    id integer DEFAULT NEXTVAL('cs_icon_sequence'::regclass) NOT NULL,
    name character varying(64) NOT NULL,
    file_name character varying(100) DEFAULT 'default_icon.gif'::character varying NOT NULL
);

CREATE SEQUENCE cs_java_class_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_java_class (
    id integer DEFAULT NEXTVAL('cs_java_class_sequence'::regclass) NOT NULL,
    qualifier character varying(100),
    type character varying(100) DEFAULT 'unknown'::character varying NOT NULL,
    notice character varying(500)
);

CREATE SEQUENCE cs_permission_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_permission (
    id integer DEFAULT NEXTVAL('cs_permission_sequence'::regclass) NOT NULL,
    KEY character varying(10),
    description character varying(100)
);

CREATE SEQUENCE cs_policy_sequence
    START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_policy (
    id integer DEFAULT NEXTVAL('cs_policy_sequence'::regclass) NOT NULL,
    name character varying(20) NOT NULL
);

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

CREATE TABLE cs_type (
    id integer DEFAULT NEXTVAL(('cs_type_sequence'::text)::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    class_id integer,
    complex_type BOOLEAN DEFAULT false NOT NULL,
    descr text,
    editor integer,
    renderer integer
);

CREATE SEQUENCE cs_ug_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_ug (
    id integer DEFAULT NEXTVAL('cs_ug_sequence'::regclass) NOT NULL,
    name character varying(32) NOT NULL,
    descr text,
    domain integer NOT NULL,
    prio integer NOT NULL,
    UNIQUE ( prio )
);

CREATE TABLE cs_ug_attr_perm (
    id integer DEFAULT NEXTVAL(('cs_ug_attr_perm_sequence'::text)::regclass) NOT NULL,
    ug_id integer NOT NULL,
    attr_id integer NOT NULL,
    permission integer,
    domain integer
);

CREATE TABLE cs_ug_cat_node_perm (
    id integer DEFAULT NEXTVAL(('cs_ug_cat_node_perm_sequence'::text)::regclass) NOT NULL,
    ug_id integer NOT NULL,
    domain integer,
    cat_node_id integer NOT NULL,
    permission integer
);

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

CREATE TABLE cs_usr (
    id integer DEFAULT NEXTVAL(('cs_usr_sequence'::text)::regclass) NOT NULL,
    login_name character varying(32) NOT NULL,
    password character varying(16),
    last_pwd_change timestamp without time zone NOT NULL,
    administrator BOOLEAN DEFAULT false NOT NULL,
    pw_hash char(64),
    salt char(16),
    last_pw_hash char(64),
    last_salt char(16)
);

CREATE SEQUENCE cs_attr_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE SEQUENCE cs_cat_node_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE SEQUENCE cs_class_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE SEQUENCE cs_type_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE SEQUENCE cs_ug_attr_perm_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE SEQUENCE cs_ug_cat_node_perm_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE SEQUENCE cs_usr_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

ALTER TABLE ONLY cs_ug_attr_perm
    ADD CONSTRAINT attr_perm_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_ug_cat_node_perm
    ADD CONSTRAINT cat_node_perm_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_ug_class_perm
    ADD CONSTRAINT class_perm_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_cat_link
    ADD CONSTRAINT cs_cat_link_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_class_attr
    ADD CONSTRAINT cs_class_attr_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_domain
    ADD CONSTRAINT cs_domain_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_icon
    ADD CONSTRAINT cs_icon_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_java_class
    ADD CONSTRAINT cs_java_class_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_permission
    ADD CONSTRAINT cs_permission_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_policy
    ADD CONSTRAINT cs_policy_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_policy_rule
    ADD CONSTRAINT cs_policy_rule_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_policy_rule
    ADD CONSTRAINT cs_policy_rule_policy_key UNIQUE (policy, permission);

ALTER TABLE ONLY cs_ug_membership
    ADD CONSTRAINT cs_ug_membership_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_ug
    ADD CONSTRAINT cs_ug_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_attr
    ADD CONSTRAINT x_cs_attr_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_cat_node
    ADD CONSTRAINT x_cs_cat_node_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_class
    ADD CONSTRAINT x_cs_class_name_key UNIQUE (name);

ALTER TABLE ONLY cs_class
    ADD CONSTRAINT x_cs_class_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_type
    ADD CONSTRAINT x_cs_type_name_key UNIQUE (name);

ALTER TABLE ONLY cs_type
    ADD CONSTRAINT x_cs_type_pkey PRIMARY KEY (id);

ALTER TABLE ONLY cs_usr
    ADD CONSTRAINT x_cs_usr_login_name_key UNIQUE (login_name);

ALTER TABLE ONLY cs_usr
    ADD CONSTRAINT x_cs_usr_pkey PRIMARY KEY (id);

CREATE INDEX cl_idx ON cs_cat_node USING btree (class_id);

CREATE INDEX ob_idx ON cs_cat_node USING btree (object_id);

CREATE INDEX obj_cl_idx ON cs_cat_node USING btree (class_id, object_id);


INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'cids_GEOMETRY', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'INTEGER', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'INT2', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'INT4', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'INT8', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'NUMERIC', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'CHAR', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'VARCHAR', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'TEXT', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'BOOL', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'FLOAT4', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'FLOAT8', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'DATE', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'TIMESTAMP', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'BPCHAR', NULL, FALSE, NULL, NULL, NULL);

INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'Extension Type', NULL, FALSE, NULL, NULL, NULL);

CREATE SEQUENCE cs_config_attr_key_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_key (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_key_sequence'),
    KEY VARCHAR(200) NOT NULL,
    group_name VARCHAR(256) NOT NULL
);


CREATE SEQUENCE cs_config_attr_value_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_value (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_value_sequence'),
    value TEXT );

CREATE SEQUENCE cs_config_attr_type_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

CREATE TABLE cs_config_attr_type (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('cs_config_attr_type_sequence'),
    type char(1) NOT NULL,
    descr varchar(200) );

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


CREATE SEQUENCE cs_scheduled_serveractions_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;


CREATE TABLE cs_scheduled_serveractions (
  id integer NOT NULL DEFAULT nextval(('cs_scheduled_serveractions_sequence'::text)::regclass),
  key character varying,
  params_json character varying,
  body_json character varying,
  start_timestamp timestamp without time zone,
  execution_rule character varying,
  execution_timestamp timestamp without time zone,
  result_json character varying,
  aborted boolean,
  taskname character varying,
  username character varying,
  groupname character varying,
  CONSTRAINT cs_scheduled_serveractions_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);


INSERT INTO cs_config_attr_type (type, descr) VALUES ('C', 'regular configuration attribute, a simple string value');
INSERT INTO cs_config_attr_type (type, descr) VALUES ('A', 'action tag configuration attribute, value of no relevance');
INSERT INTO cs_config_attr_type (type, descr) VALUES ('X', 'XML configuration attribute, XML content wrapped by some root element');

-- rechte
INSERT INTO cs_policy (id, name) VALUES (0, 'STANDARD');
INSERT INTO cs_policy (id, name) VALUES (1, 'WIKI');
INSERT INTO cs_policy (id, name) VALUES (2, 'SECURE');


INSERT INTO cs_permission (id, KEY, description) VALUES (0, 'read', 'Leserecht');
INSERT INTO cs_permission (id, KEY, description) VALUES (1, 'write', 'Schreibrecht');


--- Wenn man anderes Schema benutzt braucht man dort auch die salt funktion

--- Funktion zur SALT Erzeugung
CREATE OR REPLACE FUNCTION salt(integer) RETURNS text
    AS '(SELECT array_to_string(array 
       ( 
              SELECT substr(''abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'', trunc(random() * 62)::INTEGER + 1, 1)
              FROM   generate_series(1, \$1)), ''''))'
    LANGUAGE SQL
    VOLATILE
    RETURNS NULL ON NULL INPUT;



--- Trigger, der die Trigger-Funktion benutzt, wenn cs_usr geaendert wird
CREATE TRIGGER password_trigger BEFORE INSERT OR UPDATE ON cs_usr FOR EACH ROW EXECUTE PROCEDURE public.set_pw();

INSERT INTO cs_config_attr_value (id, value)
VALUES (DEFAULT, 'true');

-- Dynamic Children Helper

-- cs_dynamic_children_helper

CREATE SEQUENCE cs_dynamic_children_helper_sequence
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;
CREATE TABLE cs_dynamic_children_helper
(
    id integer DEFAULT NEXTVAL(('cs_dynamic_children_helper_sequence'::text)::regclass) NOT NULL,
    name character varying(256),
    code text,
    CONSTRAINT cs_dynamic_children_helper_pkey PRIMARY KEY (id)
)
WITH (
    OIDS=FALSE
);

-- execute()
CREATE OR REPLACE FUNCTION execute(_command character varying)
  RETURNS character varying AS
\$BODY\$
DECLARE _r int;
BEGIN
EXECUTE _command;
    RETURN 'Yes: ' || _command || ' executed';
EXCEPTION
    WHEN OTHERS THEN
    RETURN 'No:  ' || _command || ' failed';
END;
\$BODY\$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- cs_refresh_dynchilds_functions()
CREATE OR REPLACE FUNCTION cs_refresh_dynchilds_functions()
  RETURNS character varying AS
\$BODY\$
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
perform execute('CREATE OR REPLACE FUNCTION csdc.'||name||' RETURNS VARCHAR AS \$\$ select'''||regexp_replace(replace(code,'''',''''''),'(.*?)<ds::param.*>(.*?)</ds::param>(.*?)',E'\\\\1''||\$\\\\2||''\\\\3','g')||'''::varchar \$\$ LANGUAGE ''sql'';') from cs_dynamic_children_helper;
    RETURN 'Functions refreshed';
EXCEPTION
    WHEN OTHERS THEN
    RETURN 'Error occured';
END;
\$BODY\$
  LANGUAGE plpgsql VOLATILE
  COST 100;

`;

export default sql;

// 
// INSERT INTO cs_policy_rule (id, policy, permission, default_value) VALUES (1, 0, 0, '1');
// INSERT INTO cs_policy_rule (id, policy, permission, default_value) VALUES (2, 0, 1, '0');
// INSERT INTO cs_policy_rule (id, policy, permission, default_value) VALUES (3, 1, 0, '1');
// INSERT INTO cs_policy_rule (id, policy, permission, default_value) VALUES (4, 1, 1, '1');
// INSERT INTO cs_policy_rule (id, policy, permission, default_value) VALUES (5, 2, 0, '0');
// INSERT INTO cs_policy_rule (id, policy, permission, default_value) VALUES (6, 2, 1, '0');


// -- Inserts zum Anlegen eines Standardbenutzers admin und einer neuen Benutzergruppe Administratoren
// INSERT INTO cs_domain (name) VALUES('LOCAL');
// INSERT INTO cs_ug (name, domain, prio) VALUES ('Administratoren', (SELECT id FROM cs_domain WHERE name = 'LOCAL'), 0);
// INSERT INTO cs_usr(login_name,password,last_pwd_change,administrator) VALUES('admin','cismet',(SELECT CURRENT_TIMESTAMP),True);
// INSERT INTO cs_ug_membership (ug_id,usr_id) VALUES ((SELECT id FROM cs_ug WHERE name ='Administratoren'),(SELECT id FROM cs_usr WHERE login_name ='admin'));
// INSERT INTO cs_ug (name, domain, prio) VALUES ('Gäste', (SELECT id FROM cs_domain WHERE name = 'LOCAL'), 1);
// INSERT INTO cs_usr(login_name,password,last_pwd_change,administrator) VALUES('gast','cismet',(SELECT CURRENT_TIMESTAMP),false);
// INSERT INTO cs_ug_membership (ug_id,usr_id) VALUES ((SELECT id FROM cs_ug WHERE name ='Gäste'),(SELECT id FROM cs_usr WHERE login_name ='gast'));


// --- Umstellung auf Passwort-Hash (einmalig)
// UPDATE cs_usr SET salt = public.salt(16);
// UPDATE cs_usr SET pw_hash = md5(salt || password);
// UPDATE cs_usr SET password = '*****';
