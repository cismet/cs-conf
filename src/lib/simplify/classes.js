import normalizeClasses from "../normalize/classes";
import { copyFromTemplate, defaultClass } from "../tools/defaultObjects";
import simplifyAttributes from "./attributes";

function simplifyClasses(classes) {
    if (classes == null) return null;

    let simplified = [];
    for (let clazz of normalizeClasses(classes)) {
        if (clazz != null) {
            let classWithSimplifiedIcon = Object.assign(clazz, {
                icon: clazz.icon == null && clazz.classIcon == clazz.objectIcon ? clazz.classIcon : clazz.icon,
                classIcon: clazz.classIcon == clazz.objectIcon ? undefined : clazz.classIcon,
                objectIcon: clazz.classIcon == clazz.objectIcon ? undefined : clazz.objectIcon,
            });
            let simplifiedClazz = copyFromTemplate(classWithSimplifiedIcon, defaultClass);
            if (clazz.attributes !== undefined) {
                simplifiedClazz.attributes = simplifyAttributes(clazz.attributes, clazz.pk);
            }
            if (simplifiedClazz.name == simplifiedClazz.table) {
                delete simplifiedClazz.name;
            }
            simplified.push(simplifiedClazz);
        }
    }
    return simplified.length > 0 ? simplified : undefined;
}

export default simplifyClasses;