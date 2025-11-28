import { halton, sqrtFloor } from "./mathHelper.js";

export function genInitData(count, stride) {

    const initData = new Float32Array(count * stride);

    return initData;
}

export function genRandCol(MAXCOL) {
    const posPixels = [];
    for (let row = 0; row < MAXCOL; row++) {
        for (let col = 0; col < MAXCOL; col++) {
            posPixels.push(Math.random()+0.2, Math.random()+0.2, Math.random()+0.2, 0);// colX, colY, colZ, _empty
        }
    }
    return new Float32Array(posPixels);
}


export function genRectHaltonPos(scale, corner, MAXCOL, minSize, maxSize, duration) {

    const localXStart = corner[0];  
    const localYStart = corner[1];
    const partiCount = MAXCOL*MAXCOL;

    const posPixels = [];
    for (let row = 0; row < MAXCOL; row++) {
        for (let col = 0; col < MAXCOL; col++) {
            const haltonX = halton(2, row * MAXCOL + col);
            const haltonY = halton(3, row * MAXCOL + col);
            const localX = localXStart + haltonX * scale;
            const localZ = localYStart + haltonY * scale;
            const size = minSize + Math.random() * (maxSize - minSize);
            const startTime = (row * MAXCOL + col) * duration / partiCount;
            posPixels.push(localX, localZ, size, startTime);
        }
    }

    return new Float32Array(posPixels);
}


export function genRectHaltonPosOLD(scale, corner, partiCount, geneCount, size, duration) {
    const posPixels = [];

    const localXStart = corner[0];
    const localYStart = corner[1];

    for (let row = 0; row < geneCount; row++) {
        for (let col = 0; col < partiCount; col++) {
            const haltonX = halton(2, row * partiCount + col);
            const haltonY = halton(3, row * partiCount + col);
            const localX = localXStart + haltonX * scale;
            const localZ = localYStart + haltonY * scale;
            const startTime = (row * partiCount + col) * duration / partiCount;
            posPixels.push(localX, localZ, size, startTime);
        }
    }

    return new Float32Array(posPixels);
}


export function genLinVel(MAXCOL, startLinVel, numTypes=1) {
    const posPixels = [];

    for(let row = 0; row < MAXCOL; row++)
        for(let col = 0; col < MAXCOL; col++){
            const vx = 5*(Math.random() * 2 - 1); // Random value between -1 and 1
            const vy = 100*(-Math.random()); // Random value between -1 and 0
            const aniType = Math.floor(Math.random() * numTypes);

            // posPixels.push(vx, vy, 0, 1);
            posPixels.push(...startLinVel, aniType);
        }

    return new Float32Array(posPixels);
}


export function genAngVel(MAXCOL) {
    const posPixels = [];

    for(let row = 0; row < MAXCOL; row++)
        for(let col = 0; col < MAXCOL; col++){
            const vx = 5*(Math.random() * 2 - 1); // Random value between -1 and 1
            const vy = 100*(-Math.random()); // Random value between -1 and 0

            // posPixels.push(vx, vy, 0, 1);
            posPixels.push(0,0,0,1)
        }

    return new Float32Array(posPixels);
}


// 0--duration(1s)
// 0 -1000ms (delta: 66.7) ==== rate:60 i++ (0-60)
// Math.Random()*2*PI ==> x,y
// startTime: i*66.7/1000
export function generateCirclePosVelRandom(partiCount, startSize, endSize) {
    const posPixels = [];
    const radius = 50;

    for(let i = 0; i < partiCount; i++) {

        // position
        const angle = Math.random() * 2 * Math.PI; 
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        posPixels.push(x, y, 0.0, startSize);

        // linearVelocity
        const tangentX = Math.sin(angle); 
        const tangentY = -Math.cos(angle);  
        const
            speedLength = 0,
            speed = (angle / (2 * Math.PI)) * speedLength;

        posPixels.push(tangentX * speed, tangentY * speed, 0.0, endSize);

    }

    return posPixels;
}

export function genQuadUV(size){
    const halfSize = 0.5*size;
    return [
        -halfSize,      0,    -halfSize,        0, 0,
        -halfSize,      0,    halfSize,         0, 1,
        halfSize,       0,     halfSize,        1, 1,
        -halfSize,      0,    -halfSize,        0, 0,
        halfSize,       0,    halfSize,         1, 1,
        halfSize,       0,     -halfSize,       1, 0,
    ]
}

