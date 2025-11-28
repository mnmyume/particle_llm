#version 300 es
#define POSITION_LOCATION 0
#define LINEAR_VELOCITY_LOCATION 1
#define ACCELERATION_LOCATION 2
#define GENERATION_LOCATION 3
#define SIZE_LOCATION 4
#define FRAME_LIFE_LOCATION 5
#define ANI_TYPE_LOCATION 6

precision highp float;
precision highp int;

#define GEN_SIZE 2

#value uEmitterSlot0:[0,1]
uniform sampler2D uEmitterSlot0[GEN_SIZE];    // posX, posZ, size, startTime
#value uEmitterSlot1:[2,3]
uniform sampler2D uEmitterSlot1[GEN_SIZE];    // linVelX, linVelY, linVelZ, aniType
#value uEmitterSlot2:[4,5]
uniform sampler2D uEmitterSlot2[GEN_SIZE];    // angVelX, angVelZ, _empty, _empty

#value uDeltaTime:0.01666
uniform float uDeltaTime;

#value uEmitterTransform:mat4(1.0)
uniform mat4 uEmitterTransform;

#value uState:0
uniform int uState; // 1: init mode, 2: play mode
#value uLoop:true
uniform bool uLoop;

uniform float uTime;    // game time

uniform float uDuration;
uniform float uLifeTime;
uniform float uCount;
uniform float uMAXCOL;
#value uAccDivisor:10000
uniform float uAccDivisor;
#value uAccFactor:1
uniform float uAccFactor;


#define PARMS 5
#value uFieldParams:[0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0]
// #value uFieldParams:[vec4(0),vec4(0),vec4(0),vec4(0),vec4(0)]
uniform mat3 uFieldParams[PARMS];
// 0: switcher.x, gravity.yzw;
// 1: switcher.x, vortexScalar.y, __, __;
// 2: switcher.x, noiseScalar.yzw;
// 3: switcher.x, dampScalar.y, __, __;



#buffer aPos:particleBuffer, size:3, stride:52, offset:0
layout(location = POSITION_LOCATION) in vec3 aPos;

#buffer aLinVel:particleBuffer, size:3, stride:52, offset:12
layout(location = LINEAR_VELOCITY_LOCATION) in vec3 aLinVel;

#buffer aAcc:particleBuffer, size:3, stride:52, offset:24
layout(location = ACCELERATION_LOCATION) in vec3 aAcc;

#buffer aGeneration:particleBuffer, size:1, stride:52, offset:36
layout(location = GENERATION_LOCATION) in float aGeneration;

#buffer aSize:particleBuffer, size:1, stride:52, offset:40
layout(location = SIZE_LOCATION) in float aSize;

#buffer aFrameLife:particleBuffer, size:1, stride:52, offset:44
layout(location = FRAME_LIFE_LOCATION) in float aFrameLife;

#buffer aAniType:particleBuffer, size:1, stride:52, offset:48
layout(location = ANI_TYPE_LOCATION) in float aAniType;


out vec3 vPos;
out vec3 vLinVel;
out vec3 vAcc;
out float vGeneration;
out float vSize;
out float vFrameLife;
out float vAniType;


vec2 getEmitterCoord(float particleID, float MAXCOL) {
    vec2 uv = vec2(mod(particleID,MAXCOL), floor(particleID/MAXCOL))/MAXCOL;
    uv += vec2(1.0/MAXCOL*0.5);    //  offset to center of pixel
    return uv;
}


vec3 gravityField(vec3 linVel, vec3 gravity) {
    linVel = linVel + gravity * uDeltaTime;
    return linVel;
}

vec3 vortexField(vec3 pos, float scalar) {   //vec3 axis, needs Quaternion Helper
    vec3 linVel = vec3(-pos.z,0, pos.x)*scalar;
    return linVel;
}

vec3 noiseField(vec3 pos, vec3 scalar) {

    float x = fract(sin(dot(pos.xy,vec2(12.9898,78.233)))* 43758.5453)-0.5;
    float y = fract(sin(dot(pos.xy,vec2(62.2364,94.674)))* 62159.8432)-0.5;
    float z = fract(sin(dot(pos.xy,vec2(989.2364,94.674)))* 12349.8432)-0.5;

    vec3 d = vec3(x,y,z);

    return scalar*normalize(d);
}

vec3 damp(vec3 linVel, float k, float dTime) {
    return linVel*(1.0-k);
}


mat3 rot = mat3(
0.1116, -0.9936,  0.0148,
0.6333,  0.0820,  0.7697,
-0.7659, -0.0751,  0.6383
);
vec3 turbulence(vec3 pos, float num, float amp, float speed, float freq, float exp) {

    for(float i=0.0; i<num; i++)
    {
        float phase = freq * (pos * rot).x + speed * uTime + i;

        pos += amp * rot[0] * sin(phase) / freq;

        rot *= rot;

        freq *= exp;
    }

    return pos;
}


vec3 updatePos(vec3 pos, vec3 linVel) {
    return pos = pos + linVel * uDeltaTime;
}


void main()
{

    vec3 pos = aPos;
    vec3 linVel = aLinVel;
    vec3 acc = aAcc;
    float size = aSize;
    float frameLife = aFrameLife;
    float aniType = aAniType;


    float particleID = float(gl_InstanceID);
    vec2 emitterUV = getEmitterCoord(particleID, uMAXCOL);

    aniType = texture(uEmitterSlot1[0], emitterUV).w;

    float startTime = texture(uEmitterSlot0[0], emitterUV).w;
    float localTime = uTime - startTime > 0.0 ? mod(uTime - startTime, uLifeTime) : 0.0;
    float percentLife = localTime / uLifeTime;

    float lastGene = aGeneration;
    float generation = uTime - startTime > 0.0 ? mod(floor((uTime - startTime)/uLifeTime), float(GEN_SIZE)) : -1.0;


    bool emit = generation!=lastGene && generation!=-1.0;
    if(emit || uState == 1){

        vec2 emitterPos = vec2(0,0);
        if(generation == 0.0){
            size = texture(uEmitterSlot0[0], emitterUV).z;
            emitterPos = texture(uEmitterSlot0[0], emitterUV).xy;
            linVel = texture(uEmitterSlot1[0], emitterUV).xyz;
        }else if(generation == 1.0){
            size = texture(uEmitterSlot0[1], emitterUV).z;
            emitterPos = texture(uEmitterSlot0[1], emitterUV).xy;
            linVel = texture(uEmitterSlot1[1], emitterUV).xyz;
        }

        pos = (uEmitterTransform * vec4(emitterPos.x, 0, emitterPos.y, 1)).xyz;
    }
    else if(generation != -1.0) {
        vec3 oldPos = aPos;
        vec3 oldVel = aLinVel;
        size = texture(uEmitterSlot0[0], emitterUV).z;

        float gravitySwitcher = uFieldParams[0][0].x;
        vec3 gravity = vec3(uFieldParams[0][0].yz, uFieldParams[0][1].x);
        float vortexSwitcher = uFieldParams[1][0].x;
        float vortexScalar = uFieldParams[1][0].y;
        float noiseSwitcher = uFieldParams[2][0].x;
        vec3 noiseScalar = vec3(uFieldParams[2][0].yz, uFieldParams[2][1].x);
        float dampSwitcher = uFieldParams[3][0].x;
        float dampScalar = uFieldParams[3][0].y;
        float turbulenceSwitcher = uFieldParams[4][0].x;
        float turbulenceNum = uFieldParams[4][0].y;
        float turbulenceAmp = uFieldParams[4][0].z;
        float turbulenceSpeed = uFieldParams[4][1].x;
        float turbulenceFreq = uFieldParams[4][1].y;
        float turbulenceExp = uFieldParams[4][1].z;


        if(gravitySwitcher == 1.0) {
            linVel = gravityField(oldVel, gravity);
        }
        if(vortexSwitcher == 1.0) {
            linVel += vortexField(pos, vortexScalar);
        }
        if(noiseSwitcher == 1.0) {
            linVel  += noiseField(pos, noiseScalar);
        }
        if(dampSwitcher == 1.0){
            linVel = oldVel + damp(linVel-oldVel, dampScalar, uDeltaTime);
        }
        if(turbulenceSwitcher == 1.0){
            vec3 turbPos = turbulence(oldPos, turbulenceNum, turbulenceAmp, turbulenceSpeed, turbulenceFreq, turbulenceExp);
            vec3 turbVel = (turbPos - oldPos);
            // linVel += length(linVel) * turbVel;
            linVel += max(length(linVel), 1.0) * turbVel;
        }

        pos = updatePos(pos, oldVel);

        acc = (linVel - oldVel)/uDeltaTime;

        float accFrameOffset = uAccFactor * acc.x / uAccDivisor;
        frameLife = mod(frameLife + accFrameOffset * uLifeTime, uLifeTime);
        frameLife = (frameLife < 0.0) ? frameLife + 1.0 : frameLife;
    }

    gl_Position = vec4(pos, 1.0);

    vPos = pos;
    vLinVel = linVel;
    vAcc =  acc;
    vGeneration = generation;
    vSize = size;
    vFrameLife = frameLife;
    vAniType = aniType;
}
