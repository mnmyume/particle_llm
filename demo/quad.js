import Shader from "../source/shader.js";
import Transform from "../source/transform.js";
import Material from "../source/material.js";
import Shape from "../source/shape.js";
import Texture2D from "../source/texture2d.js";

import { readAttrSchema } from "../source/shapeHelper.js";
import { genQuadUV } from "../source/generatorHelper.js";

import quadVert from "../shaders/glsl/quad-vert.glsl"
import quadFrag from "../shaders/glsl/quad-frag.glsl"


export function initQuad(gl, canvas, camera) {

    const quadParams = {
        quadSize: 10,
        quadColor: [0.7, 0, 0.3]
    }

    // init quad shader
    const quadShader = new Shader({
        vertexSource: quadVert,
        fragmentSource: quadFrag,
    });
    quadShader.initialize({gl});

    // init transform
    const quadTransform = new Transform();
    quadTransform.setPosition(0, 0, 0);
    // quadTransform.scale(scalarX, scalarY, scalarZ);

    // init material
    const quadMaterial = new Material('quadMat',{
        shader: quadShader,
    });
    quadMaterial.initialize({gl});
    quadMaterial.setUniform('uColor', quadParams.quadColor);
    // quadMaterial.setTexture('uTex', texture);

    // init quad shape
    const quadData = genQuadUV(quadParams.quadSize);
    const quadShape = new Shape(
        'quad',
        {verticeCount: 6, schema: readAttrSchema(quadVert.input)});
    quadShape.initialize({gl});
    quadShape.update(gl, 'quadBuffer', {material:quadMaterial, data:quadData});

    function drawSimpleQuad() {

        gl.clearColor(0.2, 0.2, 0.2, 1.0);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        quadMaterial.preDraw(gl, camera, quadTransform);
        quadShape.draw(gl, quadMaterial);
        quadMaterial.postDraw(gl);

        requestAnimationFrame(drawSimpleQuad);
    }

    drawSimpleQuad();
}
