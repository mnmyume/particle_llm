import {$assert} from "./common.js";


export default class Solver {
    static MODE = {init:1, play:2}
    shape = [];
    material = [];
    transformFeedbacks = [];
    currIndex = 0;

    get Mode(){return this.mode;}
    set Mode(value){this.mode=value;}

    constructor(params) {
        this.shape = params.shape || null;
        this.material = params.material || null;
        this.count = params.count || 1;
        this.mode = params.mode || 0;
        this.loop = params.loop || false;
        this.stride = params.stride || null;
        this.data = params.data || null;
    }

    initialize({ gl }) {
        this.transformFeedbacks = [gl.createTransformFeedback(), gl.createTransformFeedback()];

        this.material.setUniform('uLoop', this.loop);

        this.shape.update(gl, 'particleBuffer',{material:this.material, solver:this, data:this.data});
    }

    update(gl) {

        if(!(this.mode & Solver.MODE.play || this.mode & Solver.MODE.init ))
            return;

        this.material.setUniform('uState', this.mode);

        const destIndex = (this.currIndex + 1) % 2;

        const currVAO = this.shape.vaos[this.currIndex];
        const destVAO = this.shape.vaos[destIndex];
        const destBuffer = destVAO.dataBuffer.buffer;
        const destTransformFeedback = this.transformFeedbacks[destIndex];


        this.material.preDraw(gl);

        gl.bindVertexArray(currVAO.vao);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, destTransformFeedback);

        // NOTE: The following two lines shouldn't be necessary, but are required to work in ANGLE
        // due to a bug in its handling of transform feedback objects.
        // https://bugs.chromium.org/p/angleproject/issues/detail?id=2051
        // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, destBuffer);


        for (const attr in this.material.attributes) {
            const attrValue = this.material.dataLocation.attributes[attr];
            if(attrValue<0) continue;
            gl.vertexAttribDivisor(attrValue, 1);
        }

        gl.enable(gl.RASTERIZER_DISCARD);

        gl.beginTransformFeedback(gl.POINTS);
        // gl.drawArrays(gl.POINTS, 0, this.count);
        gl.drawArraysInstanced(gl.POINTS, 0, 1, this.count);
        gl.endTransformFeedback();


        gl.disable(gl.RASTERIZER_DISCARD);
        this.material.postDraw(gl);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

        this.currIndex = (this.currIndex + 1) % 2;


        // debug
        // gl.bindBuffer(gl.ARRAY_BUFFER, destBuffer);
        // const readbackArray = new Float32Array(this.count * this.stride);
        // gl.getBufferSubData(gl.ARRAY_BUFFER, 0, readbackArray);
        // console.log(readbackArray);
    }


}
