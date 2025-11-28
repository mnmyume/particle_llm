import Shape from './shape.js';
import {$assert} from "./common.js";
import VAO from "./vao.js";


export default class SolverShape extends Shape {

    get VAOS(){return this.vaos};
    set VAOS(value){this.vaos = value};

    constructor(name, params = {}) {
        super(name, params);
    }

    initialize({ gl }) {
        for(const {name, value} of this.schema) {
            const vao0 = new VAO(name, {schema: value});
            vao0.initialize({gl});
            this.vaos.push(vao0);
            const vao1 = new VAO(name, {schema: value});
            vao1.initialize({gl});
            this.vaos.push(vao1);
        }
    }


    update(gl, key, {material, solver, data, type='STREAM_COPY'}) {
        for(let buffIndex=0; buffIndex<2; buffIndex++) {
            this.vaos[buffIndex].update(gl, key, {material, data, type} );

            // set up output
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, solver.transformFeedbacks[buffIndex]);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.vaos[buffIndex].dataBuffer.buffer);

            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        }
    }


    // update(gl, key, {material, data, solver, type='STATIC_DRAW'}) {
    //
    //     for(let buffIndex=0; buffIndex<2; buffIndex++){
    //         const finder = this.dataBuffer[buffIndex].find(ele=>ele.name === key);
    //         $assert(finder);
    //         if(!finder) return;
    //
    //         finder.data = data;
    //
    //
    //         gl.bindVertexArray(this.vao[buffIndex]);
    //
    //         for (const attr in material.attributes) {
    //             gl.vertexAttribDivisor(material.dataLocation.attributes[attr], 1);
    //         }
    //
    //         gl.bindBuffer(gl.ARRAY_BUFFER, finder.buffer);
    //         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl[type]);
    //
    //         for(const [key,value] of Object.entries(material.dataLocation.attributes)){
    //             $assert(value>=0);
    //             gl.enableVertexAttribArray(value);
    //             // const dataBuffer = this.dataBuffer.find(ele=>ele.value.find(({attribute})=>attribute === key));
    //             const {size,stride,offset} = finder.value.find(({attribute})=>attribute === key);
    //             gl.vertexAttribPointer(value,parseInt(size), gl.FLOAT, false, parseInt(stride), parseInt(offset));
    //         }
    //         gl.bindVertexArray(null);
    //         gl.bindVertexArray(null);
    //
    //         // set up output
    //         gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, solver.transformFeedbacks[buffIndex]);
    //         gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, finder.buffer);
    //
    //         gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    //     }
    //
    // }

    delete(gl) {

    }

    draw(gl, material) {

    }
}
