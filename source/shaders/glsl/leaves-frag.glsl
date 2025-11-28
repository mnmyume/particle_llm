#version 300 es
precision highp float;
precision highp int;

#include "./includes/aniTex.glsl"

#value uColorSampler:0
uniform sampler2D uColorSampler;


uniform vec3 uColor;
#value shrink:0.88
uniform float shrink;


in float vGeneration;
in vec3 vLinVel;
in float vAniType;
in float vFrame;


out vec4 fragColor;


mat2 rotateVelMatrix(vec2 vel) {

    vec2 col1 = normalize(vec2(vel.x, -vel.y));
    vec2 col2 = normalize(vec2(vel.y, vel.x));

    return mat2(col1, col2);
}

vec2 rotateUV(vec2 uv, mat2 rot) {
    vec2 centeredUV = uv - vec2(0.5, 0.5);
    centeredUV *= shrink;
    vec2 rotatedUV = rot * centeredUV;
    vec2 finalUV = rotatedUV + vec2(0.5);

    return finalUV;
}


void main()
{

    if(vGeneration < 0.0)
        discard;

    vec4 aniTexParams = _GEN_ANI_TEX_UV(uColorSampler, vAniType, vFrame);
    vec2 aniTexCoord = aniTexParams.xy;
    vec2 numColsRows = aniTexParams.zw;

    vec2 localUV = vec2(gl_PointCoord.x, 1.0-gl_PointCoord.y);

    mat2 rot = rotateVelMatrix(vLinVel.xy);
    vec2 rotatedLocalUV = rotateUV(localUV, rot);

    vec2 finalUV = rotatedLocalUV/numColsRows + aniTexCoord;

    vec4 color = texture(uColorSampler, finalUV);

    if(color.a<0.8)
        discard;

    fragColor = color;

}