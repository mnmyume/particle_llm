import { $assert } from './common.js';
import VAO from './vao.js';
const __DEBUG__ = true;

export default class Shape {
    static RENDERSTATE = {triangle:1,line:2,point:3,instance:4};

    get VAOS(){return this.vaos};
    set VAOS(value){this.vaos = value};

    constructor(name, params={}) {
        this.name = name;
        this.schema = params.schema??[];
        this.state = params.state?? Shape.RENDERSTATE.triangle;
        this.count = params.count??1;
        this.verticeCount = params.verticeCount??6;
        this.vaos = params.vaos??[];
        this.vao = null;
    }

    initialize({ gl }) {
        for(const {name, value} of this.schema) {
            const vao = new VAO(name, {schema: value});
            vao.initialize({gl});
            this.vaos.push(vao);
        }

    };
    update(gl, key, {material, data, type='STATIC_DRAW'}) {

        const vao = this.vaos.find(ele=>ele.name === key);
        vao.update(gl, key, {material, data, type} );
    }

    // update(gl, key, {material, data, type='STATIC_DRAW'}) {
    //
    //
    //     const finder = this.dataBuffers.find(ele=>ele.name === key);
    //     $assert(finder);
    //     if(!finder) return;
    //
    //     finder.data = data;
    //
    //     gl.bindVertexArray(this.vao);
    //
    //     gl.bindBuffer(gl.ARRAY_BUFFER, finder.buffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl[type]);
    //
    //     for(const [key,value] of Object.entries(material.dataLocation.attributes)){
    //         $assert(value>=0);
    //         gl.enableVertexAttribArray(value);
    //         // const dataBuffers = this.dataBuffers.find(ele=>ele.value.find(({attribute})=>attribute === key));
    //         const {size,stride,offset} = finder.value.find(({attribute})=>attribute === key);
    //         gl.vertexAttribPointer(value,parseInt(size), gl.FLOAT, false, parseInt(stride), parseInt(offset));
    //     }
    //     gl.bindVertexArray(null);
    // }
    delete(gl){

        for(const vao of this.vaos)
            vao.delete(gl);

        this.name = null;
        this.schema = null;
        this.state = null;
        this.count = null;

    }
    draw(gl, material) {

        // for (const {name,data,type} of this.dataBuffers.filter(ele=>ele.type === 'DYNAMIC_DRAW')){
        //     $assert(data);
        //     this.update(gl, name, data,type);
        // }


        for(const vao of this.vaos)
            gl.bindVertexArray(vao.vao);



        if (this.state == Shape.RENDERSTATE.triangle) {
            // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            // gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

            gl.drawArraysInstanced(gl.TRIANGLES, 0 , this.verticeCount, this.count);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

        } 
        if (this.state == Shape.RENDERSTATE.line) {
            // //gl.drawArrays(gl.LINES, 0, this.vertexBuffer.numItems);
            // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            // gl.drawElements(gl.LINES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
        if (this.state == Shape.RENDERSTATE.point) {


            gl.drawArraysInstanced(gl.POINTS, 0,  1, this.count);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

        }
    };

}
