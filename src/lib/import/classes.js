import * as stmnts from './statements';
import * as dbtools from '../tools/db';

export function prepareData(classes) {

    let csTypeEntries=[];
    let csJavaClassEntries=[];
    let icons=[];
    let csClassAttrEntries=[];
    let csClassEntries=[];
    let csAttrDbTypeEntries=[];
    let csAttrCidsTypeEntries=[];
        

    let javaClasses=new Set();

    let defaulValueWarning = false;

    for (let c of classes) {
        let cEntry={};
        cEntry.name=c.name||c.table;
        cEntry.descr=c.descr;
        cEntry.classIcon=c.classIcon||c.icon;
        cEntry.objectIcon=c.objectIcon||c.icon;
        if (icons.indexOf(cEntry.classIcon)===-1){
            icons.push(cEntry.classIcon);
        }
        if (icons.indexOf(cEntry.objectIcon)===-1){
            icons.push(cEntry.objectIcon);
        }
        cEntry.table=c.table;
        cEntry.pk=c.pk;

        cEntry.indexed=c.indexed||false;
        if (c.toString) {
            if (!javaClasses.has(c.toString.type+"."+c.toString.class)) {
                if (c.toString.class && c.toString.type) {
                    javaClasses.add(c.toString.type+"."+c.toString.class);
                    csJavaClassEntries.push([c.toString.class,c.toString.type]);
                }
            }
            cEntry.toStringClass=c.toString.class;
            cEntry.toStringType=c.toString.type;
        }
        if (c.editor) {
            if (!javaClasses.has(c.editor.type+"."+c.editor.class)) {
                if (c.editor.class && c.editor.type) {
                    javaClasses.add(c.editor.type+"."+c.editor.class);
                    csJavaClassEntries.push([c.editor.class,c.editor.type]);
                }
            }
            cEntry.editorClass=c.editor.class;
            cEntry.editorType=c.editor.type;
        }
        if (c.renderer) {
            if (!javaClasses.has(c.renderer.type+"."+c.renderer.class)) {
                if (c.renderer.class && c.renderer.type) {
                    javaClasses.add(c.renderer.type+"."+c.renderer.class);
                    csJavaClassEntries.push([c.renderer.class,c.renderer.type]);
                }
            }
            cEntry.rendererClass=c.renderer.class;
            cEntry.rendererType=c.renderer.type;
        }
        cEntry.array_link=c.array_link||false;
        cEntry.policy=c.policy;
        cEntry.attributePolicy=c.attribute_policy;
        csClassEntries.push([
            cEntry.name, 
            cEntry.descr, 
            cEntry.classIcon, 
            cEntry.objectIcon, 
            cEntry.table,
            cEntry.pk,
            cEntry.indexed,
            cEntry.toStringClass,
            cEntry.toStringType,
            cEntry.editorClass,
            cEntry.editorType,
            cEntry.rendererClass,
            cEntry.rendererType,
            cEntry.array_link,
            cEntry.policy,
            cEntry.attributePolicy]);

        //For Types
        csTypeEntries.push([cEntry.name, cEntry.table]);

        let posCounter=0;
        for (let a of c.attributes) {
            let aEntry={};
            aEntry.table=cEntry.table;
            aEntry.isArray=false;
            aEntry.xx=1;

            if (a.dbType){ //1:1
                aEntry.foreign_key=false;    
                aEntry.type_name=a.dbType;
            }
            else if (a.cidsType){
                aEntry.foreign_key=true;
                aEntry.type_name=a.cidsType;
                // Takes the info out of the type
                // not needed
                aEntry.foreign_key_references_to_table_name=a.cidsType; //TODO
            }
            else if (a.manyToMany){
                aEntry.foreign_key=true;
                aEntry.isArray=true;
                aEntry.type_name=a.manyToMany;
                aEntry.foreign_key_references_to_table_name=a.manyToMany;
            }
            else if (a.oneToMany) {
                aEntry.foreign_key=true;
                aEntry.type_name=a.oneToMany;
                aEntry.xx=-1;
                aEntry.isArray=false;
            }
              
            aEntry.name=a.name||a.field;
            aEntry.fieldname=a.field;
            aEntry.substitute=a.substitute||false;
            aEntry.descr=a.descr;
            if (a.hidden && a.hidden===true) {
                aEntry.visible=false;    
            }
            else {
                aEntry.visible=true;
            }
            aEntry.indexed=a.indexed||false;
            aEntry.arrayKey=a.arrayKey;
            if (a.mandatory && a.mandatory===true) {
                aEntry.optional=false;
            }
            else {
                aEntry.optional=true;
            }
            if (a.editor) {
                aEntry.editorClass=a.editor.class;
                aEntry.editorType=a.editor.type;
            }
            if (a.toString ) {
                aEntry.toStringClass=a.toString.class;
                aEntry.toStringType=a.toString.type
            }
            if (a.complexEditor) {
                aEntry.complexEditorClass=a.complexEditor.class;
                aEntry.complexEditortype=a.complexEditor.type;
            }
            if (a.fromString) {
                aEntry.fromStringClass=a.fromString.class;
                aEntry.fromStringType=a.fromString.type;
            }
            if (a.defaulValue) {
                defaulValueWarning = true;
                aEntry.defaultValue=a.defaulValue;
            } else if (a.defaultValue) {
                aEntry.defaultValue=a.defaultValue;
            }
            aEntry.pos=posCounter;
            posCounter+=10;
            aEntry.precision=a.precision;
            aEntry.scale=a.scale;
            if (a.extension_attr && a.extension_attr===true){
                aEntry.extensionAttribute=true; 
            }
            else {
                aEntry.extensionAttribute=false; 
            }
            
            if (a.dbType){
                csAttrDbTypeEntries.push(
                    [
                        aEntry.table,
                        aEntry.type_name,
                        aEntry.name,
                        aEntry.fieldname,
                        aEntry.foreign_key,
                        aEntry.substitute,
                        aEntry.foreign_key_references_to_table_name,
                        aEntry.descr,
                        aEntry.visible,
                        aEntry.indexed,
                        aEntry.isArray,
                        aEntry.arrayKey,
                        aEntry.editorClass,
                        aEntry.editorType,
                        aEntry.toStringClass,
                        aEntry.toStringType,
                        aEntry.complexEditorClass,
                        aEntry.complexEditortype,
                        aEntry.optional,
                        aEntry.defaultValue,
                        aEntry.fromStringClass,
                        aEntry.fromStringType,
                        aEntry.pos,
                        aEntry.precision,
                        aEntry.scale,
                        aEntry.extensionAttribute
                    ]
                );
               }
            else {                
                csAttrCidsTypeEntries.push(
                    [
                        aEntry.table,
                        aEntry.type_name,
                        aEntry.name,
                        aEntry.fieldname,
                        aEntry.foreign_key,
                        aEntry.substitute,
                        aEntry.foreign_key_references_to_table_name,
                        aEntry.descr,
                        aEntry.visible,
                        aEntry.indexed,
                        aEntry.isArray,
                        aEntry.arrayKey,
                        aEntry.editorClass,
                        aEntry.editorType,
                        aEntry.toStringClass,
                        aEntry.toStringType,
                        aEntry.complexEditorClass,
                        aEntry.complexEditortype,
                        aEntry.optional,
                        aEntry.defaultValue,
                        aEntry.fromStringClass,
                        aEntry.fromStringType,
                        aEntry.pos,
                        aEntry.precision,
                        aEntry.scale,
                        aEntry.extensionAttribute,
                        aEntry.xx
                    ]
                );
            
            }
            
    

        }
        if (c.additionalAttributes){
            for (let ca in c.additionalAttributes){
                csClassAttrEntries.push(
                    [
                        cEntry.table,
                        ca,
                        c.additionalAttributes[ca]
                    ]);
            }
        }
    }


    const csIconEntries=[]
    for (let i of icons){
        if (i){
            csIconEntries.push([i.substr(0,i.indexOf('.')),i]);
        }
    }


    if (defaulValueWarning) {
        console.log(" !!!!!!!!!!!!!!!");
        console.log(" !!! WARNING !!! usage of typo 'defaulValue' in classes.js. This should by changed to the correct spelling 'defaultValue'. The typo is still interpreted though.");
        console.log(" !!!!!!!!!!!!!!!");
    }

    return { csTypeEntries, 
        csJavaClassEntries, 
        csIconEntries, 
        csClassAttrEntries,
        csClassEntries,
        csAttrDbTypeEntries,
        csAttrCidsTypeEntries
     };
}
 
const importClasses = async (client, classes) => {
    const { csTypeEntries, 
        csJavaClassEntries, 
        csIconEntries, 
        csClassAttrEntries,
        csClassEntries,
        csAttrDbTypeEntries,
        csAttrCidsTypeEntries
     } = prepareData(classes);
    
    
    console.log("importing icons ("+csIconEntries.length+")");
    await dbtools.singleRowFiller(client,stmnts.simple_cs_icon, csIconEntries);
    
    console.log("importing java classes ("+csJavaClassEntries.length+")");
    //console.log(csJavaClassEntries);
    await dbtools.singleRowFiller(client,stmnts.simple_cs_java_class, csJavaClassEntries);
    
    console.log("importing classes ("+csClassEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_class, csClassEntries);
    
    console.log("importing types ("+csTypeEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_type, csTypeEntries);
   
    console.log("importing simple attributes ("+csAttrDbTypeEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_attr4dbTypes, csAttrDbTypeEntries);
    
    console.log("importing complex attributes ("+csAttrCidsTypeEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_attr4cidsTypes, csAttrCidsTypeEntries);
   
    console.log("importing class attributes ("+csClassAttrEntries.length+")");
    await dbtools.nestedFiller(client,stmnts.complex_cs_class_attr, csClassAttrEntries);

}

export default importClasses;