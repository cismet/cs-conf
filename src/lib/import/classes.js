import util from 'util';

function prepareClasses(classes) {
    let csTypeEntries = [];
    let csJavaClassEntries = [];
    let icons = [];
    let csClassAttrEntries = [];
    let csClassEntries = [];
    let csAttrDbTypeEntries = [];
    let csAttrCidsTypeEntries = [];        
    let javaClasses = new Set();

    for (let clazz of classes) {
        let name = clazz.name;
        let table = clazz.table;
        let descr = clazz.descr;
        let pk = clazz.pk;
        let array_link = clazz.array_link;
        let indexed = clazz.indexed;
        let policy = clazz.policy;
        let attributePolicy = clazz.attribute_policy;
        let classIcon = clazz.classIcon;
        let objectIcon = clazz.objectIcon;
        let toStringClass = clazz.toString != null ? clazz.toString.class : null;
        let toStringType = clazz.toString != null ? clazz.toString.type : null;
        let editorClass = clazz.editor != null ? clazz.editor.class : null;
        let editorType = clazz.editor != null ? clazz.editor.type : null;
        let rendererClass = clazz.renderer != null ? clazz.renderer.class : null;
        let rendererType = clazz.renderer != null ? clazz.renderer.type : null;

        if (classIcon != null && !icons.includes(classIcon)) {
            icons.push(classIcon);
        }

        if (objectIcon != null && !icons.includes(objectIcon)) {
            icons.push(objectIcon);
        }

        if (clazz.toString != null) {
            let fullKey = util.format("%s.%s", clazz.toString.type, clazz.toString.class);
            if (!javaClasses.has(fullKey)) {
                if (clazz.toString.class != null && clazz.toString.type != null) {
                    javaClasses.add(fullKey);
                    csJavaClassEntries.push([
                        clazz.toString.class,
                        clazz.toString.type
                    ]);
                }
            }
        }

        if (clazz.editor != null) {
            let fullKey = util.format("%s.%s", clazz.editor.type, clazz.editor.class);
            if (!javaClasses.has(fullKey)) {
                if (clazz.editor.class != null && clazz.editor.type != null) {
                    javaClasses.add(fullKey);
                    csJavaClassEntries.push([
                        clazz.editor.class,
                        clazz.editor.type
                    ]);
                }
            }
        }

        if (clazz.renderer != null) {
            let fullKey = util.format("%s.%s", clazz.renderer.type, clazz.renderer.class);
            if (!javaClasses.has(fullKey)) {
                if (clazz.renderer.class != null && clazz.renderer.type != null) {
                    javaClasses.add(fullKey);
                    csJavaClassEntries.push([
                        clazz.renderer.class,
                        clazz.renderer.type
                    ]);
                }
            }
        }

        csClassEntries.push([
            name, 
            descr, 
            classIcon, 
            objectIcon, 
            table,
            pk,
            indexed,
            toStringClass,
            toStringType,
            editorClass,
            editorType,
            rendererClass,
            rendererType,
            array_link,
            policy,
            attributePolicy,
            csClassEntries.length + 1,
        ]);

        //For Types
        csTypeEntries.push([
            name, 
            table
        ]);

        let posCounter = 0;
        for (let attribute of clazz.attributes) {
            let isArray = false;
            let xx = 1;
            let name = attribute.name;
            let fieldname = attribute.field;
            let substitute = attribute.substitute;
            let descr = attribute.descr;
            let visible = !attribute.hidden;
            let indexed = attribute.indexed;
            let arrayKey = attribute.arrayKey;
            let optional = !attribute.mandatory;
            let editorClass = attribute.editor != null ? attribute.editor.class : null;
            let editorType = attribute.editor != null ? attribute.editor.type : null;
            let toStringClass =attribute.toString != null ? attribute.toString.class : null;
            let toStringType = attribute.toString != null ? attribute.toString.type : null;
            let complexEditorClass = attribute.complexEditor != null ? attribute.complexEditor.class : null;
            let complexEditortype = attribute.complexEditor != null ? attribute.complexEditor.type : null;
            let fromStringClass = attribute.fromString != null ? attribute.fromString.class : null;
            let fromStringType = attribute.fromString != null ? attribute.fromString.type : null;
            let defaultValue = attribute.defaultValue;
            let pos = posCounter;
            let precision = attribute.precision;
            let scale = attribute.scale;
            let extensionAttribute = attribute.extension_attr; 

            let foreign_key;
            let foreign_key_references_to_table_name;
            let type_name;
            if (attribute.dbType) {
                foreign_key = false;    
                type_name = attribute.dbType;
            } else if (attribute.cidsType) {
                foreign_key = true;
                type_name = attribute.cidsType;
                // Takes the info out of the type
                // not needed
                foreign_key_references_to_table_name = attribute.cidsType; //TODO
            } else if (attribute.manyToMany) {
                foreign_key = true;
                isArray = true;
                type_name = attribute.manyToMany;
                foreign_key_references_to_table_name = attribute.manyToMany;
            } else if (attribute.oneToMany) {
                foreign_key = true;
                type_name = attribute.oneToMany;
                xx = -1;
                isArray = false;
            }              

            posCounter += 10;
            
            if (attribute.dbType) {
                csAttrDbTypeEntries.push([
                    table,
                    type_name,
                    name,
                    fieldname,
                    foreign_key,
                    substitute,
                    foreign_key_references_to_table_name,
                    descr,
                    visible,
                    indexed,
                    isArray,
                    arrayKey,
                    editorClass,
                    editorType,
                    toStringClass,
                    toStringType,
                    complexEditorClass,
                    complexEditortype,
                    optional,
                    defaultValue,
                    fromStringClass,
                    fromStringType,
                    pos,
                    precision,
                    scale,
                    extensionAttribute
                ]);
            } else {                
                csAttrCidsTypeEntries.push([
                    table,
                    type_name,
                    name,
                    fieldname,
                    foreign_key,
                    substitute,
                    foreign_key_references_to_table_name,
                    descr,
                    visible,
                    indexed,
                    isArray,
                    arrayKey,
                    editorClass,
                    editorType,
                    toStringClass,
                    toStringType,
                    complexEditorClass,
                    complexEditortype,
                    optional,
                    defaultValue,
                    fromStringClass,
                    fromStringType,
                    pos,
                    precision,
                    scale,
                    extensionAttribute,
                    xx
                ]);            
            }
        }
        if (clazz.additionalAttributes){
            for (let additionalAttributes in clazz.additionalAttributes) {
                csClassAttrEntries.push([
                    table,
                    additionalAttributes,
                    clazz.additionalAttributes[additionalAttributes],
                    csClassAttrEntries.length + 1,
                ]);
            }
        }
    }

    const csIconEntries = []
    for (let i of icons){
        if (i) {
            csIconEntries.push([ i.substr(0, i.indexOf('.')), i ]);
        }
    }

    return { 
        csTypeEntries, 
        csJavaClassEntries, 
        csIconEntries, 
        csClassAttrEntries,
        csClassEntries,
        csAttrDbTypeEntries,
        csAttrCidsTypeEntries
     };
}

export default prepareClasses;