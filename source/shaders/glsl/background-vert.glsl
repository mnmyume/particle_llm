#version 300 es
precision highp float;
precision highp int;

out vec2 vUV;

void main()
{

    vec2 positions[6] = vec2[](
    vec2(-1.0, -1.0),
    vec2(1.0, -1.0),
    vec2(-1.0, 1.0),

    vec2(-1.0, 1.0),
    vec2(1.0, -1.0),
    vec2(1.0, 1.0)
    );

    vec2 pos = positions[gl_VertexID];
    gl_Position = vec4(pos, 0.0, 1.0);

    vUV = (pos + 1.0) * 0.5;
}