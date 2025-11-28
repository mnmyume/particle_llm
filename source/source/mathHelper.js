export function halton(base, index) {
    let result = 0.0;
    let digitWeight = 1.0;
    
    while (index > 0) {
        digitWeight = digitWeight / base;
        let nominator = index - Math.floor(index / base) * base;  // mod
        result += nominator * digitWeight;
        index = Math.floor(index / base);  
    }
    
    return result;
}

export function sqrtFloor(num) {
    return Math.floor(Math.sqrt(num));
}