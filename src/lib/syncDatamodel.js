#!/usr/bin/env ./node_modules/.bin/babel-node
import fs from 'fs';
import util from 'util';
import { getClientForConfig } from './tools/db';
import wcmatch from 'wildcard-match';

const readFile = util.promisify(fs.readFile);

const createSyncStatements = async (client, existingData, allCidsClassesByTableName, tablesDone, cidsClass) => {
    let statements = [];
    let cidsTableName = cidsClass.table.toLowerCase();
    if (!tablesDone.includes(cidsTableName) && !existingData.ignoredTables.includes(cidsTableName)) {
        tablesDone.push(cidsTableName);

        let pk = "id";
        if (cidsClass.pk) {
            pk = cidsClass.pk.toLowerCase();
        }

        // table not yet existing => creating

        if (!existingData.tables.hasOwnProperty(cidsTableName)) {

            let sequenceName = util.format("%s_seq", cidsTableName);
            let columns = [];

            if (cidsClass.attributes) {
                for (let cidsAttribute of cidsClass.attributes) {
                    let fieldName = cidsAttribute.field.toLowerCase();
                    if (!(cidsAttribute.extension_attr || cidsAttribute.oneToMany)) {

                        // skipping extension- and 1-n- attributes
                        if (cidsAttribute.cidsType) {
                            
                            // foreign key => recursion 

                            let subCidsTableName = cidsAttribute.cidsType.toLowerCase();
                            let subCidsClass = allCidsClassesByTableName[subCidsTableName];
                            // directly adding recursive results to statements-array for assuring
                            // that the most bottom table is created first
                            statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, subCidsClass));
                            
                            columns.push({ name: fieldName, type: "integer", null: !cidsAttribute.mandatory });
                        } else {

                            if (cidsAttribute.manyToMany) {
                                    // array attribute => adding mandatory integer column
                                columns.push({ name: fieldName, type: "integer", primary: fieldName == pk, null: false });
                            } else {
                                // primitive attribute => adding column with attributes
                                columns.push({ name: fieldName, type: fullTypeFromAttribute(cidsAttribute), primary: fieldName == pk, null: !cidsAttribute.mandatory, default: cidsAttribute.defaultValue});
                            }

                            if (fieldName == pk) {
                                // no need to create a pk anymore, it was explicitly defined
                                pk = null;
                            }
                        }
                    } 
                } 
                if (pk) {
                    // adding primary key (at the beginning)
                    columns.unshift({ name: pk, type: "integer", null: false, default: util.format("nextval('%s')", sequenceName) })
                }

            }

            statements.push({ action: "CREATE TABLE", table: cidsTableName, columns: columns, sequence: !existingData.sequences.includes(sequenceName) });

        } else {

            // table already existing => altering
            let existingTable = existingData.tables[cidsTableName];

            if (existingTable.tableType.toLowerCase() == 'base table') {

                // skipping views (f.e.)

                let columnsDone = [];
                if (cidsClass.attributes) {
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

                                if (!existingTable.columns.hasOwnProperty(fieldName)) {
                                    statements.push({ action: "ADD COLUMN", table: cidsTableName, column: fieldName, type: "integer", null: !cidsAttribute.mandatory });
                                }

                            } else {

                                if (!existingTable.columns.hasOwnProperty(fieldName)) {
                                                                                   
                                    // column missing => adding                                
                                    if (cidsAttribute.manyToMany) {
                                        // array attribute => adding mandatory integer column
                                        statements.push({ action: "ADD COLUMN", table: cidsTableName, column: fieldName, type: "integer", null: false });
                                    } else {
                                        let type = fullTypeFromAttribute(cidsAttribute);
                                        
                                        let defaultValue = (type && cidsAttribute.defaultValue && (type.toLowerCase() == "text" || type.toLowerCase().startsWith("char") || type.toLowerCase().startsWith("varchar"))) ? util.format("'%s'", cidsAttribute.defaultValue) : cidsAttribute.defaultValue;
                                        statements.push({ action: "ADD COLUMN", table: cidsTableName, column: fieldName, type: fullTypeFromAttribute(cidsAttribute), null: !cidsAttribute.mandatory, default: defaultValue});
                                    }

                                } else {
                                    let existingColumn = existingTable.columns[fieldName];                            

                                    let oldType = { 
                                        dbType: existingColumn.dataType, 
                                        precision: existingColumn.precision, 
                                        scale: existingColumn.scale 
                                    };

                                    let statement = { action: "CHANGE COLUMN", table: cidsTableName, column: fieldName, primary : fieldName == pk, oldType: fullTypeFromAttribute(oldType), oldNull: existingColumn.null, oldDefault: existingColumn.default };
        
                                    if (fieldName == pk) {
                                        pk = null;
                                    }

                                    // primitive column existing => altering if needed

                                    let typeIdentical = (
                                            (cidsAttribute.manyToMany && existingColumn.dataType.toLowerCase() == 'int4')
                                            || cidsTypeToDb(cidsAttribute.dbType).toLowerCase() == existingColumn.dataType.toLowerCase()
                                        )                            
                                        && (cidsAttribute.precision == existingColumn.precision)
                                        && (cidsAttribute.scale == existingColumn.scale);
                                    
                                    if (!typeIdentical) {
                                        // type changes detected => altering
                                        statement.type = fullTypeFromAttribute(cidsAttribute);
                                        statement.null = !cidsAttribute.mandatory;
                                        statement.default = (statement.type && cidsAttribute.defaultValue && (statement.type.toLowerCase() == "text" || statement.type.toLowerCase().startsWith("char") || statement.type.toLowerCase().startsWith("varchar"))) ? util.format("'%s'", cidsAttribute.defaultValue) : cidsAttribute.defaultValue;
                                    } else {
                                        // attribute modifications if needed

                                        let mandatory = false;
                                        if (cidsAttribute.mandatory) {
                                            mandatory = cidsAttribute.mandatory;
                                        }
                                        if (mandatory == existingColumn.isNullable) {
                                            statement.null = !mandatory;
                                        }

                                        let escapedExisting = cidsAttribute.defaultValue && (existingColumn.dataType.toLowerCase() == "text" || existingColumn.dataType.toLowerCase().startsWith("char") || existingColumn.dataType.toLowerCase().startsWith("varchar")) ? existingColumn.default : util.format("'%s'", existingColumn.default);
                                        if (cidsAttribute.defaultValue !== undefined && escapedExisting != util.format("'%s'", cidsAttribute.defaultValue)) {
                                            statement.default = existingColumn.dataType && cidsAttribute.defaultValue && (existingColumn.dataType.toLowerCase() == "text" || existingColumn.dataType.toLowerCase().startsWith("char") || existingColumn.dataType.toLowerCase().startsWith("varchar")) ? util.format("'%s'", cidsAttribute.defaultValue) : cidsAttribute.defaultValue;
                                        }

                                        // special treatment if mandatory and default value is set => update data
                                        if (statement.null || statement.default) {
                                            statement.update = cidsAttribute.mandatory && existingColumn.isNullable && cidsAttribute.defaultValue;
                                        }
                                    }
                                    if (statement.type !== undefined || statement.null !== undefined || statement.default !== undefined || statement.update !== undefined) {
                                        statements.push(statement);
                                    }
                                }          
                            }    
                        }
                    }
                }

                if (pk) {
                    // primary key => fixed attributes

                    let existingColumn = existingTable.columns[pk];                            

                    if (existingColumn) {
                        let oldType = { 
                            dbType: existingColumn.dataType, 
                            precision: existingColumn.precision, 
                            scale: existingColumn.scale 
                        };

                        let statement = { action: "CHANGE COLUMN", table: cidsTableName, column: pk, primary : true, oldType: fullTypeFromAttribute(oldType), oldNull: existingColumn.null, oldDefault: existingColumn.default };

                        if (existingColumn.isNullable) {
                            statement.oldNull = existingColumn.isNullable;
                        }
                        if (existingColumn.defaulValue) {
                            statement.oldDefault = existingColumn.defaulValue;
                        }

                        if (existingColumn.isNullable) {
                            statement.null = false;
                        }
                        if(existingColumn.default != "nextval('" + cidsTableName + "_seq'::text)" && existingColumn.default != "nextval('" + cidsTableName + "_seq'::regclass)") {
                            statement.default = util.format("nextval('%s_seq');", cidsTableName);
                        }
                        if (statement.type !== undefined || statement.null !== undefined || statement.default !== undefined || statement.update !== undefined) {
                            statements.push(statement);
                        }                                        

                        // dont drop the pk column
                        columnsDone.push(pk);
                    }
                }

                for (let columnDone of columnsDone) {
                    delete existingTable.columns[columnDone];
                }
                Object.keys(existingTable.columns).forEach(function(key) {
                    statements.push({ action: "DROP COLUMN", table: cidsTableName, column: key });
                });        
            }
        }
    }
    return statements;
}

function cidsTypeToDb(type) {
    if (type) {
        switch(type.toUpperCase()) {
            case "CHAR": return "bpchar";
            case "INTEGER": return "int4";
            case "CIDS_GEOMETRY": return "geometry";
            default: return type.toLowerCase();
        }
    }
}

function fullTypeFromAttribute(cidsAttribute) {
    let fullType = cidsTypeToDb(cidsAttribute.dbType);
    if (fullType == "numeric" && cidsAttribute.precision) {
        fullType += util.format("(%s", cidsAttribute.precision);
        if (cidsAttribute.scale) {
            fullType += util.format(", %s", cidsAttribute.scale);
        }
        fullType += ")";
    } else if (fullType == "bpchar" && cidsAttribute.precision) {
        fullType += util.format("(%s)", cidsAttribute.precision);
    } else if (fullType == "varchar" && cidsAttribute.precision) {
        fullType += util.format("(%s)", cidsAttribute.precision);
    }    
    return fullType;
}

function queriesFromStatement(statement) {
    let queries = [""];

    switch(statement.action) {
        case "DROP TABLE": {
            queries.push(util.format("DROP TABLE %s;", statement.table));
            if (statement.sequence) {
                queries.push(util.format("DROP SEQUENCE %s_seq;", statement.table));
            }
        } break;
        case "CREATE TABLE": {
            let sequenceName = util.format("%s_seq", statement.table);
            queries.push(util.format("-- START creating table %s", statement.table));

            if (statement.sequence !== undefined) {
                queries.push(util.format("CREATE SEQUENCE %s INCREMENT BY 1 NO MAXVALUE NO MINVALUE;", sequenceName));
            }
            let columnSnippets = [];
            for (let column of statement.columns) {
                let snippet = util.format("\n  %s %s", column.name, column.type.toLowerCase());
                if (column.primary) {
                    snippet += " PRIMARY KEY";
                } else if (column.null !== undefined) {
                    if (column.null) {
                        snippet += " NULL";                    
                    } else {
                        snippet += " NOT NULL";
                    }
                }
                if (column.default !== undefined) {
                    if (column.type.toLowerCase() == "text" || column.type.toLowerCase().startsWith("char") || column.type.toLowerCase().startsWith("varchar")) {
                        snippet += util.format(" DEFAULT '%s'", column.default);
                    } else {
                        snippet += util.format(" DEFAULT %s", column.default);
                    }
                }        
                columnSnippets.push(snippet);
            }

            // joining column-snippets and adding tmp-statements to the statements
            if (columnSnippets.length > 0) {
                queries.push(util.format("CREATE TABLE %s (%s\n);", statement.table, columnSnippets.join(", ")));
            } else {
                queries.push(util.format("CREATE TABLE %s;", statement.table));
            }
            queries.push("-- END");
        } break;
        case "DROP SEQUENCE": {
            let sequenceName = util.format("%s_seq", statement.table);
            queries.push(util.format("DROP SEQUENCE %s;",sequenceName));
        } break;
        case "ADD COLUMN": {
            let sequenceName = util.format("%s_seq", statement.table);

            let typeAndAttributes = statement.type;
            if (statement.primary) {
                typeAndAttributes += " PRIMARY KEY";
            } else if (statement.null) {
                typeAndAttributes += " NULL"
            } else {
                typeAndAttributes += " NOT NULL"
            }

            if (statement.default !== undefined) {
                typeAndAttributes += util.format(" DEFAULT %s", statement.default);
            }

            if (statement.sequence !== undefined) {
                queries.push(util.format("CREATE SEQUENCE %s INCREMENT BY 1 NO MAXVALUE NO MINVALUE;", sequenceName));
            }

            queries.push(util.format("-- START adding column %s to table %s", statement.column, statement.table));
            queries.push(util.format("ALTER TABLE %s ADD COLUMN %s %s;", statement.table, statement.column, typeAndAttributes));
            queries.push("-- END");
        } break;
        case "CHANGE COLUMN": {
            let tmpColumn = util.format("%s_%d", statement.column, Date.now());

            queries.push(util.format("-- START changing column %s.%s", statement.table, statement.column));
            if (statement.type !== undefined) {
                queries.push(util.format("-- changing type from %s to %s", statement.oldType, statement.type));
                queries.push(util.format("ALTER TABLE %s RENAME COLUMN %s TO %s;", statement.table, statement.column, tmpColumn));
                // ["\nBEGIN TRANSACTION;", ...queries, dryRun ? "-- because of dry-run\nROLLBACK TRANSACTION;" : "COMMIT TRANSACTION;" ]    

                let typeAndAttributes = statement.type;
                if (statement.null !== undefined) {
                    typeAndAttributes += " NULL"
                } else {
                    typeAndAttributes += " NOT NULL"
                }
                if (statement.default !== undefined) {
                    typeAndAttributes += util.format(" DEFAULT %s", statement.default);
                }
                queries.push(util.format("ALTER TABLE %s ADD COLUMN %s %s;", statement.table, statement.column, typeAndAttributes));
                queries.push(util.format("UPDATE %s SET %s = %s;", statement.table, statement.column, tmpColumn));
                queries.push(util.format("ALTER TABLE %s DROP COLUMN %s;", statement.table, tmpColumn));
            } else {
                if (statement.update !== undefined) {
                    queries.push(util.format("UPDATE TABLE %s SET %s = '%s' WHERE %s IS NULL;", statement.table, statement.column, statement.defaultValue, statement.column));
                    if (statement.default == null) {                
                        queries.push("-- > WARNING, no default value for mandatory field. this may fail !")
                    }
                }
    
                if (statement.default === null) {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s DROP DEFAULT;", statement.table, statement.column));    
                } else if (statement.default !== undefined) {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET DEFAULT %s;", statement.table, statement.column, statement.default));    
                }
                if (statement.null !== undefined) {
                    queries.push(util.format("ALTER TABLE %s ALTER COLUMN %s SET %s;", statement.table, statement.column, statement.null ? "NULL" : "NOT NULL"));
                }
    
            }
            queries.push("-- END");
        } break;
        case "DROP COLUMN": {
            queries.push(util.format("ALTER TABLE %s DROP COLUMN %s;", statement.table, statement.column));
        } break;
    }

    return queries;
}

export async function worker(folder, executeSync, purge, config) {
    try {
        console.log("* reading classes...");
        let classes = JSON.parse(await readFile(folder + "/classes.json", {encoding: 'utf8'}));

        let ignoreRules = ["cs_*", "geometry_columns"];
        try {
            let sync = JSON.parse(await readFile(folder + "/sync.json", {encoding: 'utf8'}));        
            ignoreRules.push(... sync.tablesToIgnore);
        } catch (e) {
            console.log("* no sync.json found");
        }

        let allCidsClasses = [...classes];
        let allCidsClassesByTableName = {};

        let attributesCount = 0;
        let defaulValueDetected = false;
        for (let singleCidsClass of allCidsClasses) {
            if (singleCidsClass.table) {
                allCidsClassesByTableName[singleCidsClass.table.toLowerCase()] = singleCidsClass;
            }
            if (singleCidsClass.attributes) {
                for (let attribute of singleCidsClass.attributes) {
                    if(attribute.defaulValue) {
                        attribute.defaultValue = attribute.defaulValue;
                        defaulValueDetected = true;
                        delete attribute.defaulValue;                    
                    }
                    attributesCount++;
                }
            }
        }
        console.log(util.format("  > %d attributes found in %d classes.", attributesCount, classes.length));

        if (defaulValueDetected) {
            console.log("  > !!!!!!!!!!!!!!!");
            console.log("  > !!! WARNING !!! Typo 'defaulValue' detected. Continuing by fixing it in memory. This should by changed to the correct spelling 'defaultValue'.");
            console.log("  > !!!!!!!!!!!!!!!");
            console.log("");
        }

        console.log(util.format("* loading config %s...", config));
        const client = await getClientForConfig(config);

        console.log(util.format("* connecting to db %s@%s:%d/%s...", client.user, client.host, client.port, client.database));
        await client.connect();

        let existingData = {
            tables : {},
            sequences : []
        };

        console.log("* analysing existing sequences...");
        let sequencesQuery = "SELECT sequence_name FROM information_schema.sequences ORDER BY sequence_name;";
        let { rows : sequencesResults } = await client.query(sequencesQuery);
        for (let result of sequencesResults) {
            let sequenceKey = result.sequence_name.toLowerCase();
            existingData.sequences.push(sequenceKey);
        }        
        console.log(util.format("  > %d sequences found.", existingData.sequences.length));

        console.log("* analysing existing tables...");
        let tablesQuery = "SELECT tables.table_schema AS table_schema, tables.table_type AS table_type, tables.table_name AS table_name, columns.column_name AS column_name, CASE WHEN columns.column_default ILIKE '%::' || columns.data_type THEN substring(columns.column_default, 0, length(columns.column_default) - length(columns.data_type) - 1) ELSE columns.column_default END AS column_default, columns.is_nullable = 'YES' AS column_is_nullable, columns.udt_name AS column_data_type, CASE WHEN columns.udt_name = 'bpchar' OR columns.udt_name = 'varchar' THEN columns.character_maximum_length WHEN columns.udt_name ILIKE 'numeric' THEN columns.numeric_precision ELSE NULL END AS column_precision, CASE WHEN columns.udt_name ILIKE 'numeric' THEN columns.numeric_scale ELSE NULL END AS column_scale FROM information_schema.tables LEFT JOIN information_schema.columns ON tables.table_name = columns.table_name AND tables.table_schema = columns.table_schema;";
        let { rows: tablesResults } = await client.query(tablesQuery);
        
        let ignoredTables = [];
        let ignoredSequences = [];

        for (let tablesResult of tablesResults) {
            let tableKey = (tablesResult.table_schema !== "public" ? tablesResult.table_schema + "." + tablesResult.table_name : tablesResult.table_name).toLowerCase();

            let ignoreTable = false;
            for (let ignoreRule of ignoreRules) {
                if (!ignoredTables.includes(tableKey) && wcmatch(ignoreRule)(tableKey)) {
                    if (!ignoredTables.includes(tableKey)) {
                        ignoredTables.push(tableKey);

                        let sequenceKey = util.format("%s_seq", tableKey);
                        if (existingData.sequences.includes(sequenceKey)) {
                            existingData.sequences = existingData.sequences.filter((value) => {
                                if (value == sequenceKey) {
                                    ignoredSequences.push(sequenceKey);
                                }
                                return value != sequenceKey;
                            });
                        }
                    }
                    ignoreTable = true;
                    break;                    
                }
            }
            if (ignoreTable) {
                continue;
            }

            if (!existingData.tables.hasOwnProperty(tableKey)) {
                existingData.tables[tableKey] = { 
                    name: tablesResult.table_name,
                    tableType: tablesResult.table_type,
                    schema: tablesResult.table_schema,
                    columns: {}
                };
            }
            let columnKey = tablesResult.column_name.toLowerCase();
            existingData.tables[tableKey].columns[columnKey] = {
                name: tablesResult.column_name,
                default: tablesResult.column_default,
                isNullable: tablesResult.column_is_nullable,
                dataType: tablesResult.column_data_type,
                precision: tablesResult.column_precision,
                scale: tablesResult.column_scale
            };
        }      
        
        console.log(util.format("  > %d columns found in %d tables.", tablesResults.length, Object.keys(existingData.tables).length));
        console.log("* applying ignore rules:");
        console.table(ignoreRules);
        console.log("  > ignoring tables:");
        console.table(ignoredTables);
        console.log("  > ignoring sequences:");
        console.table(ignoredSequences);

    
        existingData.ignoredTables = ignoredTables;
        existingData.ignoredSequences = ignoredSequences;

        // start statements creation recursion
    
        console.log("* preparing sync statements...");
        let statements = [];
        let tablesDone = [];
        while(allCidsClasses.length > 0) {
            let cidsClass = allCidsClasses.pop();
            statements.push(... await createSyncStatements(client, existingData, allCidsClassesByTableName, tablesDone, cidsClass));
        }    
        if (statements.length > 0) {
           console.table(statements);
        }

        // dropping unused tables
    
        for (let tableDone of tablesDone) {
            delete existingData.tables[tableDone];
        }
        Object.keys(existingData.tables).forEach(function(key) {
            if (!ignoredTables.includes(key)) {
                var tableData = existingData.tables[key];
                if (tableData.tableType.toLowerCase() == "base table" && tableData.schema.toLowerCase() == "public") {
                    let sequenceKey = util.format("%s_seq", key);
                    statements.push({ action: "DROP TABLE", table: key, sequence: existingData.sequences.includes(sequenceKey) });
                }
            }
        });
    
        // printing all statements
    
        if (statements.length > 0) {

            let skipped = [];
            let subQueries = [];
            
            for (let statement of statements) {
                if (purge !== true && statement.action.startsWith("DROP ")) {
                    skipped.push(... queriesFromStatement(statement));
                } else {
                    subQueries.push(... queriesFromStatement(statement));
                }
            }

            if (subQueries.length > 0) {
                let query = "\n";
                query += "-- ########################################\n";
                query += "-- ### BEGIN OF SYNCHRONISATION QUERIES ###\n";
                query += "-- ########################################\n";
                query += subQueries.join("\n");
                query += "\n\n";
                query += "-- ######################################\n";
                query += "-- ### END OF SYNCHRONISATION QUERIES ###\n";
                query += "-- ######################################\n";

                if (executeSync) {
                    console.log(util.format("\n* start syncing (%d queries)...", subQueries.filter((value) => {
                        return value.trim() != "" && !value.trim().startsWith("--");
                    }).length));
                    await client.query(query);
                } else {
                    console.log(util.format("\n* resulting sync queries:"));
                    console.log(query);
                }
                console.log(util.format("* syncing successfull"));
            } else {
                console.log("* nothing to sync. done !");
            }

            if (skipped.length > 0)  {
                console.log("======================");
                console.log(util.format("%d Skipped statements:", skipped.filter((value) => {
                    return value.trim() != "";
                }).length));
                console.log("----------------------");
                console.log(skipped.join("\n"));
                console.log("======================");
            }
        } else {
            console.log("* nothing to sync. done !");
        }

        // ----

        await client.end()
    } catch (e) {
        console.error(e); // 💩
        process.exit(1);
    }
}   

    



