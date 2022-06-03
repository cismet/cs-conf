import { copyFromTemplate, defaultClass } from "../tools/defaultObjects";
import simplifyAttributes from "./attributes";

function simplifyClasses(classes) {
    if (classes == null) return null;

    let simplified = [];
    if (classes != null) {
        for (let clazz of classes) {
            if (clazz != null) {
                let simplifiedClazz = copyFromTemplate(clazz, defaultClass);
                if (clazz.attributes !== undefined) {
                    simplifiedClazz.attributes = simplifyAttributes(clazz.attributes);
                }
                if (simplifiedClazz.name == simplifiedClazz.table) {
                    delete simplifiedClazz.name;
                }
                if (simplifiedClazz.classIcon == simplifiedClazz.objectIcon) {
                    simplifiedClazz.icon = simplifiedClazz.classIcon;
                    delete simplifiedClazz.classIcon;
                    delete simplifiedClazz.objectIcon;
                }
                if (simplifiedClazz.attributes !== undefined) {
                    simplifiedClazz.attributes = simplifiedClazz.attributes.filter(attribute => attribute.field != (clazz.pk !== undefined ? clazz.pk : defaultClass.pk));
                }
                simplified.push(simplifiedClazz);
            }
        }
    }        
    return simplified;
}

export default simplifyClasses;