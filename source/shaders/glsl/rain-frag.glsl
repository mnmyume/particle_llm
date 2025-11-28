#version 300 es
precision highp float;
precision highp int;


uniform vec3 uColor;
#value uPixelNum:8
uniform float uPixelNum;
#value uThickness:0.05
uniform float uThickness;
#value uStretchFactor:0.02
uniform float uStretchFactor;
#value uAlpha:1.0
uniform float uAlpha;


in float vGeneration;
in vec3 vLinVel;


out vec4 fragColor;


mat2 rotateVelMatrix(vec2 vel) {

    vec2 col1 = normalize(vec2(vel.x, -vel.y));
    vec2 col2 = normalize(vec2(vel.y, vel.x));

    return mat2(col1, col2);
}

vec2 rotateUV(vec2 uv, mat2 rot) {
    vec2 centeredUV = uv - vec2(0.5, 0.5);
    vec2 rotatedUV = rot * centeredUV;
    vec2 finalUV = rotatedUV + vec2(0.5);

    return finalUV;
}


void main()
{

    if(vGeneration < 0.0)
        discard;

    vec2 uv = floor(vec2(gl_PointCoord.x, 1.-gl_PointCoord.y)*uPixelNum)/uPixelNum;

    mat2 rot = rotateVelMatrix(vLinVel.xy);
    vec2 rotUV = rotateUV(uv, rot);

    float velLength = uStretchFactor * length(vLinVel);
    float stretch = clamp(velLength, 0.0, 1.0);

    float center = 0.5;

    float dist = abs(rotUV.y - center);
    float line = dist < uThickness ? 1.0 : 0.0;

    float start = 0.5 - 0.5 * stretch;
    float end = 0.5 + 0.5 * stretch;
    float visibleLength = (rotUV.x > start && rotUV.x < end) ? 1.0 : 0.0;

    float alphaMask = line * visibleLength * uAlpha;

//    if (alphaMask < 0.9) discard;

    fragColor = vec4(uColor, alphaMask);
}