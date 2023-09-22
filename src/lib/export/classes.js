import { clean } from '../tools/tools.js';

function exportClasses({ csClasses, csAttrs, csClassAttrs }, {}) {
    let classAttrsPerTable = new Map(); 
    
    for (let csClassAttr of csClassAttrs) {
        let classAttribute = classAttrsPerTable.get(csClassAttr.table);
        if (!classAttribute) {
            classAttribute = {};
            classAttrsPerTable.set(csClassAttr.table, classAttribute);
        }
        classAttribute[csClassAttr.key] = csClassAttr.value;
    }

    let attrsPerTable = new Map();
    let attributes = [];
    for (let csAttr of csAttrs) {
        let attribute = Object.assign({}, csAttr);
        let tableAttributes = attrsPerTable.get(attribute.table);
        if (!tableAttributes) {
            tableAttributes = [];
            attrsPerTable.set(attribute.table, tableAttributes);
        }

        // clean up

        delete attribute.table;
        if (attribute.field === attribute.name) {
            delete attribute.name;
        }

        if (attribute.cidsType !== null) {
            delete attribute.dbType;
            delete attribute.precision;
            delete attribute.scale;
            if (attribute.foreignKeyTableId < 0) {
                delete attribute.cidsType;
                delete attribute.optional;
                delete attribute.manyToMany;
            } else if (attribute.isArrray === true) {
                delete attribute.cidsType;
                delete attribute.optional;
                delete attribute.oneToMany;
            } else {
                delete attribute.oneToMany;
                delete attribute.manyToMany
            }
        } else {
            delete attribute.cidsType;
            delete attribute.oneToMany;
            delete attribute.manyToMany
        }

        if (attribute.mandatory === false) {
            delete attribute.mandatory;
        }

        if (attribute.hidden === false) {
            delete attribute.hidden;
        }
        if (attribute.indexed === false) {
            delete attribute.indexed;
        }
        if (attribute.substitute === false) {
            delete attribute.substitute;
        }
        if (attribute.extension_attr === false) {
            delete attribute.extension_attr;
        }

        //remove all fields that are not needed anymore
        delete attribute.foreign_key;
        delete attribute.foreignKeyTableId;
        delete attribute.foreignkeytable; // check whether this should better be used instead of tc.table_name
        delete attribute.isArrray;

        //finally remove all field that are null
        clean(attribute);

        tableAttributes.push(attribute);
        attributes.push(attribute);
    }

    let classes = [];
    for (let csClass of csClasses) {        
        let clazz = Object.assign({}, csClass);

        //clean up
        if (clazz.table === clazz.name) {
            delete clazz.name;
        }
        if (clazz.descr === null) {
            delete clazz.descr;
        }
        if (clazz.indexed === false) {
            delete clazz.indexed;
        }

        if (clazz.classIcon === clazz.objectIcon) {
            clazz.icon = clazz.classIcon;
            delete clazz.classIcon;
            delete clazz.objectIcon;
        } else {
            delete clazz.icon;
        }
        if (clazz.array_link === false) {
            delete clazz.array_link;
        }
        if (clazz.policy === null) {
            delete clazz.policy;
        }
        if (clazz.attribute_policy === null) {
            delete clazz.attribute_policy;
        }

        //toString
        if (clazz.toStringType !== null && clazz.toStringClass != null) {
            clazz.toString = {
                type: clazz.toStringType,
                class: clazz.toStringClass
            };
        }
        delete clazz.toStringType;
        delete clazz.toStringClass;
        //editor
        if (clazz.editorType !== null && clazz.editorClass != null) {
            clazz.editor = {
                type: clazz.editorType,
                class: clazz.editorClass
            };
        }
        delete clazz.editorType;
        delete clazz.editorClass;
        //renderer
        if (clazz.rendererType !== null && clazz.rendererClass != null) {
            clazz.renderer = {
                type: clazz.rendererType,
                class: clazz.rendererClass
            };
        }
        delete clazz.rendererType;
        delete clazz.rendererClass;

        //add attributes
        let attrs = attrsPerTable.get(clazz.table);
        if (attrs) {
            clazz.attributes = attrs;
        }

        //add class attributes
        let cattrs = classAttrsPerTable.get(clazz.table);
        if (cattrs) {
            clazz.additionalAttributes = cattrs;
        }
        classes.push(clazz);
    }
    return { classes, attributes };
}

export default exportClasses;