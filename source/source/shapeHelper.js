export function readAttrSchema(attr) {
    const result = [];
    for(const [key, {value, name, type}] of Object.entries(attr)) {
        let finder = result.find(ele=>ele.name === name);
        if(!finder) {
            finder = {name,value:[]};
            result.push(finder);
        }
        finder.value.push({...value,attribute:key});
    }
    return result;
}