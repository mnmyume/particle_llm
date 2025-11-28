#version 300 es
precision highp float;
precision highp int;

uniform vec3 uColorTop;
uniform vec3 uColorBottom;

in vec2 vUV;

out vec4 fragColor;

void main(void) {

    float gradient = (1.0 - vUV.y) ;

//    vec3 color = gradient * vec3(0.4, 0.8, 1.0);

    vec3 color = mix(uColorTop, uColorBottom, gradient);

    fragColor = vec4(color, 1.0);
}