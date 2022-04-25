#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import { getClientForConfig } from './tools/db';

const readFile = util.promisify(fs.readFile);

const createSyncStatements = async (client, existingData, allCidsClassesByTableName, tablesDone, cidsClass) => {
    let statements = [];
    let cidsTableName = cidsClass.table.toLowerCase();
    if (!tablesDone.includes(cidsTableName)) {
        tablesDone.push(cidsTableName);
        
        if (!existingData.tables.hasOwnProperty(cidsTableName)) {

            // table not yet existing => creating

            let columnSnippets = [];
            let tmpStatements = [];
            for (let cidsAttribute of cidsClass.attributes) {
                if (!(cidsAttribute.extension_attr || cidsAttribute.oneToMany)) {
                    // skipping extension- and 1-n- attributes
                    if (cidsAttribute.cidsType) {
                        
                        // foreign key => recursion 

                        let subCidsTableName = cidsAttribute.cidsType.toLowerCase();
                        let subCidsClass = allCidsClassesByTableName[subCidsTableName];
                        // directly adding recursive results to statements-array for assuring
                        // that the most bottom table is created first
                        statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, subCidsClass));

                    } else {

                        let fieldName = cidsAttribute.field.toLowerCase();
                        if (fieldName == cidsClass.pk.toLowerCase()) {

                            // primary key => fixed attributes

                            let sequenceName = util.format("%s_seq", cidsTableName);
                            columnSnippets.push(util.format("\n  %s INTEGER PRIMARY KEY DEFAULT nextval('%s')", fieldName, sequenceName));
                            if (!existingData.sequences.includes(sequenceName)) {

                                // sequence missing => creating

                                tmpStatements.push(util.format("CREATE SEQUENCE %s INCREMENT BY 1 NOMAXVALUE NOMINVALUE;", sequenceName));
                            }

                        } else if (cidsAttribute.manyToMany) {

                            // array attribute => adding mandatory integer column

                            columnSnippets.push(util.format("\n  %s INTEGER NOT NULL", fieldName));

                        } else {

                            // primitive attribute => adding column with attributes

                            let snippet = util.format("\n  %s %s", fieldName, cidsAttribute.dbType.toUpperCase());
                            if (cidsAttribute.precision) {
                                snippet += util.format("(%s", cidsAttribute.precision);
                                if (cidsAttribute.scale) {
                                    snippet += util.format(", %s", cidsAttribute.scale);
                                }
                                snippet += ")";
                            }
                            if (cidsAttribute.mandatory) {
                                snippet += " NOT NULL";
                            } else {
                                snippet += " NULL";                    
                            }
                            if (cidsAttribute.defaulValue) {
                                snippet += util.format(" DEFAULT %s", cidsAttribute.defaulValue);
                            }        
                            columnSnippets.push(snippet);
                        }
                    }
                } 
            } 

            // joining column-snippets and adding tmp-statements to the statements
            if (columnSnippets.length) {
                tmpStatements.push(util.format("CREATE TABLE %s (%s\n);", cidsTableName, columnSnippets.join(", ")));
            } else {
                tmpStatements.push(util.format("CREATE TABLE %s;", cidsTableName));
            }
            statements.push("\n-- START creating table " +  cidsTableName);
            statements.push(... tmpStatements);
            statements.push("-- END");

        } else {

            // table already existing => altering
            let existingTable = existingData.tables[cidsTableName];

            let columnsDone = [];
            for (let cidsAttribute of cidsClass.attributes) {
                if (!(cidsAttribute.extension_attr || cidsAttribute.oneToMany)) {
                    let fieldName = cidsAttribute.field.toLowerCase();
                    columnsDone.push(fieldName);

                    // skipping extension- and 1-n- attributes
                    if (cidsAttribute.cidsType) {

                        // foreign key => recursion 

                        let subCidsTableName = cidsAttribute.cidsType.toLowerCase();
                        let subCidsClass = allCidsClassesByTableName[subCidsTableName];
                        // directly adding recursive results to statements-array for assuring
                        // that the most bottom table is created first
                        statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, subCidsClass));

                    } else {

                        if (!existingTable.columns.hasOwnProperty(fieldName)) {

                            // column missing => adding

                            let fieldType = cidsAttribute.dbType;
                            if (cidsAttribute.precision) {
                                fieldType += "(" + cidsAttribute.precision
                                if (cidsAttribute.scale) {
                                    fieldType += ", " + cidsAttribute.scale;
                                }
                                fieldType += ")";
                            }   
                            if (cidsAttribute.mandatory) {
                                fieldType += " NOT NULL"
                            } else {
                                fieldType += " NULL"
                            }
                            if (cidsAttribute.defaulValue) {
                                fieldType += util.format(" DEFAULT %s", cidsAttribute.defaulValue);
                            }
                            statements.push("\n-- START adding column " + fieldName + " to table  " + cidsTableName);
                            statements.push(util.format("ALTER TABLE %s ADD COLUMN %s %s;", cidsTableName, fieldName, fieldType));
                            statements.push("-- END");

                        } else {
                            let existingColumn = existingTable.columns[fieldName];                            

                            if (fieldName == cidsClass.pk.toLowerCase()) {

                                // primary key => fixed attributes

                                if(existingColumn.default != "nextval('" + cidsTableName + "_seq'::text)" && existingColumn.default != "nextval('" + cidsTableName + "_seq'::regclass)") {
                                    tmpStatements.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET DEFAULT nextval('%s_seq');", cidsTableName, fieldName, cidsTableName));    
                                }
                                if (existingColumn.isNullable) {
                                    tmpStatements.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET NOT NULL;", cidsTableName, fieldName));
                                }

                            } else {

                                // primitive column existing => altering if needed


                                let typeIdentical = (
                                    (cidsAttribute.manyToMany && existingColumn.dataType.toLowerCase() == 'integer')
                                    || cidsAttribute.dbType.toLowerCase() == existingColumn.dataType.toLowerCase()
                                    || (cidsAttribute.dbType.toLowerCase() == 'float8' && existingColumn.dataType.toLowerCase() == 'double precision')
                                    || (cidsAttribute.dbType.toLowerCase() == 'double precision' && existingColumn.dataType.toLowerCase() == 'float8')
                                    || (cidsAttribute.dbType.toLowerCase() == 'int8' && existingColumn.dataType.toLowerCase() == 'bigint')
                                    || (cidsAttribute.dbType.toLowerCase() == 'bigint' && existingColumn.dataType.toLowerCase() == 'int8')
                                    || (cidsAttribute.dbType.toLowerCase() == 'cids_geometry' && existingColumn.dataType.toLowerCase() == 'user-defined')
                                    || (cidsAttribute.dbType.toLowerCase() == 'real' && existingColumn.dataType.toLowerCase() == 'float4')
                                    || (cidsAttribute.dbType.toLowerCase() == 'float4' && existingColumn.dataType.toLowerCase() == 'real')
                                    || (cidsAttribute.dbType.toLowerCase() == 'bool' && existingColumn.dataType.toLowerCase() == 'boolean')
                                    || (cidsAttribute.dbType.toLowerCase() == 'boolean' && existingColumn.dataType.toLowerCase() == 'bool')
                                    || (cidsAttribute.dbType.toLowerCase() == 'timestamp' && existingColumn.dataType.toLowerCase() == 'timestamp without time zone')
                                    || (cidsAttribute.dbType.toLowerCase() == 'timestamp with time zone' && existingColumn.dataType.toLowerCase() == 'timestamp')
                                    || (cidsAttribute.dbType.toLowerCase() == 'timestamptz' && existingColumn.dataType.toLowerCase() == 'timestamp with time zone')
                                    || (cidsAttribute.dbType.toLowerCase() == 'timestamp without time zone' && existingColumn.dataType.toLowerCase() == 'timestamptz')
                                    || (cidsAttribute.dbType.toLowerCase() == 'varchar' && existingColumn.dataType.toLowerCase() == 'character varying')
                                    || (cidsAttribute.dbType.toLowerCase() == 'character varying' && existingColumn.dataType.toLowerCase() == 'varchar')
                                    || (cidsAttribute.dbType.toLowerCase() == 'char' && existingColumn.dataType.toLowerCase() == 'character')
                                    || (cidsAttribute.dbType.toLowerCase() == 'character' && existingColumn.dataType.toLowerCase() == 'char')
                                )                            
                                && cidsAttribute.precision == existingColumn.precision
                                && (
                                    cidsAttribute.scale == existingColumn.scale || (cidsAttribute.scale == null && existingColumn.scale == null || existingColumn.scale == 0)
                                );
                                
                                if (!typeIdentical) {

                                    // type changes detected => altering

                                    let tmpFieldName = util.format("%s_%d", fieldName, Date.now());
                                    statements.push(util.format("\n-- START changing column type of %s.%s", cidsTableName, fieldName));
                                    statements.push(util.format("ALTER TABLE %s RENAME COLUMN %s TO %s;", cidsTableName, fieldName, tmpFieldName));

                                    let fieldType = cidsAttribute.dbType;
                                    if (cidsAttribute.precision) {
                                        fieldType += util.format("(%s", cidsAttribute.precision);
                                        if (cidsAttribute.scale) {
                                            fieldType += util.format(", %s", cidsAttribute.scale);
                                        }
                                        fieldType += ")";
                                    }
                                    if (cidsAttribute.mandatory) {
                                        fieldType += " NOT NULL"
                                    } else {
                                        fieldType += " NULL"
                                    }
                                    if (cidsAttribute.defaulValue) {
                                        fieldType += util.format(" DEFAULT %s", cidsAttribute.defaulValue);
                                    }

                                    statements.push(util.format("ALTER TABLE %s ADD COLUMN %s %s;", cidsTableName, fieldName, fieldType));
                                    statements.push(util.format("UPDATE %s SET %s = %s;", cidsTableName, fieldName, tmpFieldName));
                                    statements.push(util.format("ALTER TABLE %s DROP COLUMN %s;", cidsTableName, tmpFieldName));
                                    statements.push("-- END");

                                } else {

                                    // attribute modifications if needed

                                    let tmpStatements = [];
                                    if (cidsAttribute.defaulValue != existingColumn.default) {
                                        // default value
                                        if (cidsAttribute.defaulValue) {
                                            if ("'" + cidsAttribute.defaulValue + "'" != existingColumn.default) {
                                                tmpStatements.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET DEFAULT %s;", cidsTableName, fieldName, cidsAttribute.defaulValue));    
                                            }
                                        } else {
                                            tmpStatements.push(util.format("ALTER TABLE %s ALTER COLUMN %s DROP DEFAULT;", cidsTableName, fieldName));    
                                        }                                    
                                    }
                                    if (cidsAttribute.mandatory) {
                                        // null allowed
                                        if (existingColumn.isNullable) {
                                            // special treatment if default value is set. update data
                                            if (cidsAttribute.defaulValue) {
                                                tmpStatements.push(util.format("UPDATE TABLE %s SET %s = '%s' WHERE %s IS NULL;", cidsTableName, fieldName, cidsAttribute.defaulValue, fieldName));
                                            } else {
                                                tmpStatements.push("-- > WARNING, no default value for mandatory field. this may fail !")
                                            }
                                            tmpStatements.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET NOT NULL;", cidsTableName, fieldName));
                                        }
                                    } else if (!existingColumn.isNullable) {
                                        // null not allowed
                                        tmpStatements.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET NOT NULL;", cidsTableName, fieldName));
                                    }

                                    if (tmpStatements.length) {
                                        // adding all tmp-statements to statement-array if any
                                        statements.push("\n-- START changing column attributes of " + cidsTableName + "." + fieldName);
                                        statements.push(... tmpStatements);
                                        statements.push("-- END");
                                    }
                                }
                            }
                        }          
                    }    
                }
            }

            for (let columnDone of columnsDone) {
                delete existingTable.columns[columnDone];
            }
            Object.keys(existingTable.columns).forEach(function(key) {
                var columnData = existingData.tables[key];
                //if (columnData.tableType.toLowerCase() == "base table" && columnData.schema.toLowerCase() == "public" && !columnData.name.toLowerCase().startsWith("cs_") && columnData.name.toLowerCase() != "geometry_columns") {
                    statements.push(util.format("-- ALTER TABLE %s DROP COLUMN %s;", cidsTableName, key));
                //}
            });        
        }
    }
    return statements;
}

export async function worker(classesFile, dry, purge, config) {
    try {
        let classes = JSON.parse(await readFile(classesFile, {encoding: 'utf8'}));

        const client = await getClientForConfig(config);
        await client.connect();

        let existingData = {
            tables : {},
            sequences : []
        };
    
        let tablesQuery = "SELECT tables.table_schema AS table_schema, tables.table_type AS table_type, tables.table_name AS table_name, columns.column_name AS column_name,  CASE WHEN columns.column_default ILIKE '%::' || columns.data_type THEN substring(columns.column_default, 0, length(columns.column_default) - length(columns.data_type) - 1) ELSE columns.column_default END AS column_default, columns.is_nullable = 'YES' AS column_is_nullable, columns.data_type AS column_data_type, CASE WHEN columns.data_type ILIKE 'character%' THEN columns.character_maximum_length WHEN columns.data_type ILIKE 'numeric' THEN columns.numeric_precision ELSE NULL END AS precision, columns.numeric_scale AS scale FROM information_schema.tables LEFT JOIN information_schema.columns ON tables.table_name = columns.table_name AND tables.table_schema = columns.table_schema;";
        let { rows: tablesResults } = await client.query(tablesQuery);
        for (let result of tablesResults) {
            let tableKey = (result.table_schema !== "public" ? result.table_schema + "." + result.table_name : result.table_name).toLowerCase();
            if (!existingData.tables.hasOwnProperty(tableKey)) {
                existingData.tables[tableKey] = { 
                    name: result.table_name,
                    tableType: result.table_type,
                    schema: result.table_schema,
                    columns: {}
                };
            }
            let columnKey = result.column_name.toLowerCase();
            existingData.tables[tableKey].columns[columnKey] = {
                name: result.column_name,
                default: result.column_default,
                isNullable: result.column_is_nullable,
                dataType: result.column_data_type,
                precision: result.precision,
                scale: result.scale
            };
        }        
    
        let sequencesQuery = "SELECT sequence_name FROM information_schema.sequences ORDER BY sequence_name;";
        let { rows : sequencesResults } = await client.query(sequencesQuery);
        for (let result of sequencesResults) {
            let sequenceKey = result.sequence_name.toLowerCase();
            existingData.sequences.push(sequenceKey);
        }        
    
        let allCidsClasses = [...classes];
        let allCidsClassesByTableName = {};
        for (let c of allCidsClasses) {
            if (c.table) {
                allCidsClassesByTableName[c.table.toLowerCase()] = c;
            }
        }
    
        // start statements creation recursion
    
        let statements = [];
        let tablesDone = [];
        while(allCidsClasses.length) {
            let cidsClass = allCidsClasses.pop();
            statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, cidsClass));
        }
    
        // dropping unused tables
    
        for (let tableDone of tablesDone) {
            delete existingData.tables[tableDone];
        }
        Object.keys(existingData.tables).forEach(function(key) {
            var tableData = existingData.tables[key];
            if (tableData.tableType.toLowerCase() == "base table" && tableData.schema.toLowerCase() == "public" && !tableData.name.toLowerCase().startsWith("cs_") && tableData.name.toLowerCase() != "geometry_columns") {
                statements.push(util.format("-- DROP TABLE %s;", key));
                let sequenceKey = util.format("%s_seq", key);
                if (existingData.sequences.includes(sequenceKey)) {
                    statements.push(util.format("-- DROP SEQUENCE %s;", sequenceKey));
                }
            }
        });
    
        // printing all statements
    
        if (statements.length) {
            let query = "BEGIN TRANSACTION;\n"
            for (let statement of statements) {
                query += statement + "\n";
            }
            query += "\nCOMMIT TRANSACTION;"
            console.log(query);
        }

        // ----

        await client.end()
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
    }
}   

    



