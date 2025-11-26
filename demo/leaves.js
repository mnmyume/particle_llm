import Shader from "../source/shader.js";
import Time from "../source/time.js";
import Transform from "../source/transform.js";
import Material from "../source/material.js";
import Shape from "../source/shape.js";
import Texture2D from "../source/texture2d.js";
import Solver from "../source/solver.js";
import SolverMaterial from "../source/solverMaterial.js";
import SolverShape from "../source/solverShape.js";

import {readAttrSchema} from "../source/shapeHelper.js";
import {genAngVel, genLinVel, genQuadUV, genRectHaltonPos, genInitData} from "../source/generatorHelper.js";
import {sqrtFloor} from "../source/mathHelper.js";

import quadVert from "../shaders/glsl/quad-vert.glsl";
import quadFrag from "../shaders/glsl/quad-frag.glsl";
import solverVert from "../shaders/glsl/solver-vert.glsl";
import solverFrag from "../shaders/glsl/solver-frag.glsl";
import leavesVert from "../shaders/glsl/leaves-vert.glsl";
import leavesFrag from "../shaders/glsl/leaves-frag.glsl";
import bkgVert from "../shaders/glsl/background-vert.glsl";
import bkgFrag from "../shaders/glsl/background-frag.glsl";



export function initLeaves(gl, canvas, camera) {

    const time = new Time();
    const MAXGENSIZE = 2;
    const STRIDE = 13;
    const particleParams = {
        count: 400,
        duration: 20,
        lifeTime: 20,
        minSize: 30,
        maxSize: 50,
        startLinVel:[0,-2,0],
        color:[1,1,1],
        emitterSize: 64,
        emitterHeight: 170
    }
    const MAXCOL = sqrtFloor(particleParams.count);

    const gridCorner = [-particleParams.emitterSize/2, -particleParams.emitterSize/2];
    const emitterTransform = new Transform();
    emitterTransform.translate(0, particleParams.emitterHeight, 0);

    const solverParams = {
        gravitySwitcher: 1,
        gravity: [0, -10, 0],
        vortexSwitcher: 0,
        vortexScalar: 1/1000,
        noiseSwitcher: 0,
        noiseScalar: [0.3, 0.3, 0.3],
        dampSwitcher: 1,
        dampScalar: 0.8,
        turbulenceSwitcher: 1,
        turbulenceNum: 4,
        turbulenceAmp: 0.1,
        turbulenceSpeed: 0,
        turbulenceFreq: 2.0,
        turbulenceExp: 1.4
    }
    window.solverParams = solverParams;

    const bkgParams = {
        colorTop: [0.85, 0.55, 0.25],
        colorBottom: [0.95, 0.75, 0.45],
    }

    const aniTexParams = {
        texWidth: 384,
        texHeight: 32,
        cellWidth: 32,
        cellHeight: 32,
        numFrames: 12,
        numTypes: 4,
        aniFps: 6,
        accDivisor: 80000,
        accFactor: 2
    }


    // init solver
    const solverShader = new Shader({
        vertexSource: solverVert,
        fragmentSource: solverFrag,
    });
    solverShader.initialize({gl});


    const solverMaterial = new SolverMaterial('solverMaterial',{
        shader: solverShader,
    });
    solverMaterial.initialize({gl});

    const initData = genInitData(particleParams.count, STRIDE);
    const solverShape = new SolverShape('solverShape', {
        count:particleParams.count, schema: readAttrSchema(solverVert.input),
    });
    solverShape.initialize({gl});


    const solver = new Solver({
        shape: solverShape, material: solverMaterial,
        count: particleParams.count, mode:1, loop:true, stride: STRIDE,
        data:initData
    });
    solver.initialize({gl});


    const emitterSlot0 = [];
    for (let genIndex = 0; genIndex < MAXGENSIZE; genIndex++) {
        const emitterTexture = new Texture2D('emitterTexture', {
            width: MAXCOL, height: MAXCOL,
            scaleDown: 'NEAREST',
            // data: texDataArr[genIndex],
            scaleUp: 'NEAREST'
        });
        const data = genRectHaltonPos(particleParams.emitterSize, gridCorner, MAXCOL, particleParams.minSize, particleParams.maxSize, particleParams.duration);
        emitterTexture.initialize({gl});
        emitterTexture.setData(gl,data );
        emitterSlot0.push(emitterTexture);
    }
    solverMaterial.setTexture('uEmitterSlot0', emitterSlot0);
    // solverMaterial.setTexture('uEmitterSlot0[0]', emitterSlot0[0]);

    const emitterSlot1 = [];
    for (let genIndex = 0; genIndex < MAXGENSIZE; genIndex++) {
        const emitterTexture = new Texture2D('emitterTexture', {
            width: MAXCOL, height: MAXCOL,
            scaleDown: 'NEAREST',
            // data: texDataArr[genIndex],
            scaleUp: 'NEAREST'
        });
        emitterTexture.initialize({gl});
        emitterTexture.setData(gl, genLinVel(MAXCOL, particleParams.startLinVel, aniTexParams.numTypes));
        emitterSlot1.push(emitterTexture);
    }
    solverMaterial.setTexture('uEmitterSlot1', emitterSlot1);
    // solverMaterial.setTexture('uEmitterSlot1[0]', emitterSlot1[0]);
    //
    // const emitterSlot2 = [];
    // for (let genIndex = 0; genIndex < MAXGENSIZE; genIndex++) {
    //     const emitterTexture = new Texture2D('emitterTexture', {
    //         width: MAXCOL, height: MAXCOL,
    //         scaleDown: 'NEAREST',
    //         // data: texDataArr[genIndex],
    //         scaleUp: 'NEAREST'
    //     });
    //     emitterTexture.initialize({gl});
    //     emitterTexture.setData(gl, genAngVel(MAXCOL));
    //     emitterSlot2.push(emitterTexture);
    // }
    // solverMaterial.setTexture('uEmitterSlot2', emitterSlot2);
    // solverMaterial.setTexture('uEmitterSlot2[0]', emitterSlot2[0]);


    solverMaterial.setUniform('uEmitterTransform', emitterTransform.matrix);
    solverMaterial.setUniform('uDuration', particleParams.duration);
    solverMaterial.setUniform('uCount', particleParams.count);
    solverMaterial.setUniform('uLifeTime', particleParams.lifeTime);
    solverMaterial.setUniform('uMAXCOL', MAXCOL);
    solverMaterial.setUniform('uAccFactor', aniTexParams.accFactor);


    // init render
    const particleShader = new Shader({
        vertexSource: leavesVert,
        fragmentSource: leavesFrag
    });
    particleShader.initialize({gl});

    let particleMaterial;

    const colTexImg = new Image();
    colTexImg.src = '../resources/leaf/leaf-Sheet-5.png';
    colTexImg.onload = _ => {
        const colorTexture = new Texture2D('colorTexture', {
            image: colTexImg,
            scaleDown: 'LINEAR',
            scaleUp: 'LINEAR'
        });
        colorTexture.initialize({gl});

        particleMaterial = new Material('particleMaterial',{
            shader: particleShader,
        });
        particleMaterial.initialize({gl});

        particleMaterial.setUniform('uColor', particleParams.color);
        particleMaterial.setTexture('uColorSampler', colorTexture);

        // aniTex
        particleMaterial.setUniform('_uAniTexBoundarySize', [aniTexParams.texWidth, aniTexParams.texHeight]);
        particleMaterial.setUniform('_uAniTexCellSize', [aniTexParams.cellWidth, aniTexParams.cellHeight]);
        particleMaterial.setUniform('_uAniTexNumFrames', aniTexParams.numFrames);
        particleMaterial.setUniform('_uAniTexFps', aniTexParams.aniFps)


        const particleShape = new Shape('particleShape',{
            state: 3, count: particleParams.count, vaos: solverShape.VAOS,
            schema: readAttrSchema(leavesVert.input)
        });


        // init quads
        const quadShader = new Shader({
            vertexSource: quadVert,
            fragmentSource: quadFrag
        });
        quadShader.initialize({gl});

        const emitterQuadMaterial = new Material('emitterQuadMaterial', {
            shader: quadShader
        })
        emitterQuadMaterial.initialize({gl});

        const emitterQuadData = genQuadUV(particleParams.emitterSize);
        const emitterQuadShape = new Shape('emitterQuadShape', {
            verticeCount: 6, schema: readAttrSchema(quadVert.input)
        });
        emitterQuadShape.initialize({gl});
        emitterQuadShape.update(gl, 'quadBuffer',{material:emitterQuadMaterial, data:emitterQuadData});


        const groundQuadMaterial = new Material('groundQuadMaterial', {
            shader: quadShader
        })
        groundQuadMaterial.initialize({gl});

        const groundQuadData = genQuadUV(5);
        const groundQuadShape = new Shape('groundQuadShape', {
            verticeCount: 6, schema: readAttrSchema(quadVert.input)
        });
        groundQuadShape.initialize({gl});
        groundQuadShape.update(gl, 'quadBuffer',{material:emitterQuadMaterial, data:groundQuadData});


        // init background
        const bkgShader = new Shader({
            vertexSource: bkgVert,
            fragmentSource: bkgFrag
        });
        bkgShader.initialize({gl});

        const bkgMaterial = new Material('bkgMaterial', {
            shader: bkgShader
        })
        bkgMaterial.initialize({gl});
        bkgMaterial.setUniform('uColorTop', bkgParams.colorTop);
        bkgMaterial.setUniform('uColorBottom', bkgParams.colorBottom);

        const bkgShape = new Shape('bkgShape', {
            verticeCount: 6, state:1
        });
        bkgShape.initialize({gl});


        function drawLeaves() {

            requestAnimationFrame(drawLeaves);

            time.update();
            solverMaterial.setUniform('uTime', time.ElapsedTime);
            solverMaterial.setUniform('uDeltaTime', time.Interval);
            solverMaterial.setUniform('uState', solver.mode);


            const fieldParams = [];
            fieldParams[0] = [ solverParams.gravitySwitcher, ...solverParams.gravity, 0, 0, 0, 0, 0 ];
            fieldParams[1] = [ solverParams.vortexSwitcher, solverParams.vortexScalar, 0, 0, 0, 0, 0, 0, 0 ];
            fieldParams[2] = [ solverParams.noiseSwitcher, ...solverParams.noiseScalar, 0, 0, 0, 0, 0 ];
            fieldParams[3] = [ solverParams.dampSwitcher, solverParams.dampScalar, 0, 0, 0, 0, 0, 0, 0 ];
            fieldParams[4] = [ solverParams.turbulenceSwitcher, solverParams.turbulenceNum, solverParams.turbulenceAmp,
                solverParams.turbulenceSpeed, solverParams.turbulenceFreq, solverParams.turbulenceExp, 0, 0, 0 ];
            solverMaterial.setUniform('uFieldParams', fieldParams.flat());

            solverMaterial.setUniform('uAccDivisor', aniTexParams.accDivisor);
            solverMaterial.setUniform('uAccFactor', aniTexParams.accFactor);

            solver.update(gl);

            gl.viewport(0, 0, canvas.width, canvas.height);

            gl.clearColor(0.2, 0.2, 0.2, 1.0);
            gl.colorMask(true, true, true, true);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


            // render

            // draw background
            bkgMaterial.preDraw(gl, camera);
            bkgShape.draw(gl, bkgMaterial);
            bkgMaterial.postDraw(gl);

            // draw particle
            particleMaterial.preDraw(gl, camera);
            particleShape.draw(gl, particleMaterial);
            particleMaterial.postDraw(gl);

            // draw quad
            // emitterQuadMaterial.preDraw(gl, camera, emitterTransform);
            // emitterQuadShape.draw(gl, emitterQuadMaterial);
            // emitterQuadMaterial.postDraw(gl);
            //
            // groundQuadMaterial.preDraw(gl, camera);
            // groundQuadShape.draw(gl, groundQuadMaterial);
            // groundQuadMaterial.postDraw(gl);


            solverMaterial.setUniform('uDeltaTime', time.Interval);

            if (solver.Mode === Solver.MODE.init) {
                solver.Mode = Solver.MODE.play;
            }

        }

        drawLeaves();

    }
}
