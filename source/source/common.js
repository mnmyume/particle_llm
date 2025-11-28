export function $assert(condition,msg){
    if(!condition){

        if(msg)
            for(const line of msg.replaceAll('\x00','').split('\n')){
                if(line)
                    console.warn(line);
            }
        else
            debugger;

        throw new Error(msg);
    }
}
export function $match(regex, str) {
    let m, result = [];
    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            // console.log(`Found match, group ${groupIndex}: ${match}`);
            result.push(match);
        });
    }
    return result;
}

export function $getShaderInfo(name,gl, shader, file){

    const msg =  gl.getShaderInfoLog(shader);
    if(!msg) return "";


    const [,fileIndex,lineNum] =  $match(/ERROR: ([0-9]+):([0-9]+):/gm, msg);
    return msg.replace(/ERROR: (.+):[0-9]+:/gm, `file:"${file[fileIndex]}" line:${lineNum}`);

}


function $isNumber(input) {
    return input != null && (Number(input) || Number(input) == 0) ? true : false;
};
