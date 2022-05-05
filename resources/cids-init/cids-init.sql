-- default config attr types
INSERT INTO cs_config_attr_type (type, descr) VALUES ('C', 'regular configuration attribute, a simple string value');
INSERT INTO cs_config_attr_type (type, descr) VALUES ('A', 'action tag configuration attribute, value of no relevance');
INSERT INTO cs_config_attr_type (type, descr) VALUES ('X', 'XML configuration attribute, XML content wrapped by some root element');

-- rechte
INSERT INTO public.cs_policy (id, name) VALUES (0, 'STANDARD');
INSERT INTO public.cs_policy (id, name) VALUES (1, 'WIKI');
INSERT INTO public.cs_policy (id, name) VALUES (2, 'SECURE');

INSERT INTO public.cs_permission (id, KEY, description) VALUES (0, 'read', 'Leserecht');
INSERT INTO public.cs_permission (id, KEY, description) VALUES (1, 'write', 'Schreibrecht');

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
INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'TIMESTAMPTZ', NULL, FALSE, NULL, NULL, NULL);
INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'BPCHAR', NULL, FALSE, NULL, NULL, NULL);
INSERT INTO cs_type ( name, class_id, complex_type, descr, editor, renderer) VALUES ( 'Extension Type', NULL, FALSE, NULL, NULL, NULL);
