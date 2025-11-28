import Shader from "../source/source/shader.js";
import Time from "../source/source/time.js";
import Transform from "../source/source/transform.js";
import Material from "../source/source/material.js";
import Shape from "../source/source/shape.js";
import Texture2D from "../source/source/texture2d.js";
import Solver from "../source/source/solver.js";
import SolverMaterial from "../source/source/solverMaterial.js";
import SolverShape from "../source/source/solverShape.js";

import {readAttrSchema} from "../source/source/shapeHelper.js";
import {genAngVel, genLinVel, genQuadUV, genRectHaltonPos, genInitData} from "../source/source/generatorHelper.js";
import {sqrtFloor} from "../source/source/mathHelper.js";

import quadVert from "../source/shaders/glsl/quad-vert.glsl";
import quadFrag from "../source/shaders/glsl/quad-frag.glsl";
import solverVert from "../source/shaders/glsl/solver-vert.glsl";
import solverFrag from "../source/shaders/glsl/solver-frag.glsl";
import leavesVert from "../source/shaders/glsl/leaves-vert.glsl";
import leavesFrag from "../source/shaders/glsl/leaves-frag.glsl";
import bkgVert from "../source/shaders/glsl/background-vert.glsl";
import bkgFrag from "../source/shaders/glsl/background-frag.glsl";



export function initFlowers(gl, canvas, camera) {

    const time = new Time();
    const MAXGENSIZE = 2;
    const STRIDE = 13;
    const particleParams = {
        count: 400, // Total distinct particles to spawn over the entire 'duration'. EmissionRate = count / duration.
        duration: 20,   // Emission duration in seconds. Emitter stops spawning after this time.
        lifeTime: 20,   // Individual particle lifespan in seconds.
        minSize: 10,    // Minimum particle scale (World Units) for random variation.
        maxSize: 20,    // Maximum particle scale (World Units) for random variation.
        startLinVel:[0,-5,0],   // Initial linear velocity vector (vec3) applied at birth [x, y, z].
        color:[1,1,1],  // RGB particle base color, normalized linear values [0.0 to 1.0].
        emitterSize: 32,    // Diameter/Width of the emission volume (World Units).
        emitterHeight: 40   // Vertical height of the emission volume (World Units).
    }
    const MAXCOL = sqrtFloor(particleParams.count);

    const gridCorner = [-particleParams.emitterSize/2, -particleParams.emitterSize/2];
    const emitterTransform = new Transform();
    emitterTransform.translate(0, particleParams.emitterHeight, 0);

    const solverParams = {
        gravitySwitcher: 1, // Boolean Integer (0 or 1). If 1, applies gravity vector to velocity.
        gravity: [0, -10, 0],   // Constant acceleration vector [x, y, z] added to velocity each step.
        vortexSwitcher: 0,  // Boolean Integer (0 or 1). If 1, adds curl noise/rotational force.
        vortexScalar: 1/1000,   // Rotational strength multiplier. Higher values = faster spin around axis.
        noiseSwitcher: 0,   // Boolean Integer (0 or 1). If 1, adds random directional noise.
        noiseScalar: [0.3, 0.3, 0.3],   // Per-axis intensity of random noise [x, y, z].
        dampSwitcher: 1,    // Boolean Integer (0 or 1). If 1, applies linear drag/friction.
        dampScalar: 0.8,    // Velocity retention factor [0.0 to 1.0]. (Higher = thicker fluid).
        turbulenceSwitcher: 1,  // Boolean Integer (0 or 1). If 1, applies complex fractal turbulence.
        turbulenceNum: 4,   // Number of iterations (octaves) to increase detail.
        turbulenceAmp: 0.05,    // The intensity or "height" of the displacement.
        turbulenceSpeed: 0, // How fast the pattern animates over time.
        turbulenceFreq: 2.0,    // The initial density or scale of the wave pattern.
        turbulenceExp: 1.4  // Frequency multiplier per iteration (lacunarity).
    }
    window.solverParams = solverParams;

    const bkgParams = {
        colorTop: [0.4, 0.8, 0.9],
        colorBottom: [0.5, 0.9, 1.0],
    }

    const aniTexParams = {
        texWidth: 192,
        texHeight: 16,
        cellWidth: 16,
        cellHeight: 16,
        numFrames: 12,
        numTypes: 4,
        aniFps: 6,
        accDivisor: 80000,
        accFactor: 2
    }
    window.aniTexParams = aniTexParams;


    // init solver
    const solverShader = new Shader({
        name: 'solverShader',
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
        count:particleParams.count, schema: readAttrSchema(solverVert.input)
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
        emitterTexture.setData(gl,data);
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


    // init render
    const particleShader = new Shader({
        name: 'particleShader',
        vertexSource: leavesVert,
        fragmentSource: leavesFrag
    });
    particleShader.initialize({gl});

    let particleMaterial;

    const colTexImg = new Image();
    colTexImg.src = '../resources/flower/flower-Sheet-2.png';
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
            name: 'quadShader',
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
            name: 'bkgShader',
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


        function drawFlowers() {

            requestAnimationFrame(drawFlowers);

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

        drawFlowers();

    }
}
