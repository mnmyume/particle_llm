#version 300 es
precision highp float;
precision highp int;

uniform vec3 uColor;

uniform sampler2D uTex;


flat in vec2 vUV;


out vec4 color;


void main()
{
//    color = vec4(uColor, 1);
    color = texture(uTex, vUV);
}
