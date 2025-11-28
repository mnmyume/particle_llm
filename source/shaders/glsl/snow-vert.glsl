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

uniform mat4 _uni_projMat;
uniform mat4 _uni_viewMat;
#value _uni_modelMat:mat4(1.0)
uniform mat4 _uni_modelMat;


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


out float vGeneration;


void main()
{

    vec3 pos = aPos;

    gl_Position = _uni_projMat * _uni_viewMat * _uni_modelMat * vec4(pos, 1.0);
    gl_PointSize = aSize;

    vGeneration = aGeneration;
}
