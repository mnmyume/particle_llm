import {$assert} from "./common.js";

export default class VAO{

    vao;
    dataBuffer;
    name;
    schema;
    constructor(bufferName, params={schema}) {
        this.name = bufferName;
        this.schema = params.schema;
        this.vao = null;
    }
    initialize({ gl }) {

        this.dataBuffer = {buffer:gl.createBuffer(),name:this.name,schema:this.schema, data:null, type:'STATIC_DRAW'};
        this.vao = gl.createVertexArray();
    };

    update(gl, key, {material, data, type='STATIC_DRAW'}) {

        $assert(this.dataBuffer.name === key);

        const finder = this.dataBuffer;//dataBuffers.find(ele=>ele.name === key);
        $assert(finder);
        if(!finder) return;

        finder.data = data;

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, finder.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl[type]);

        for(const [key,value] of Object.entries(material.dataLocation.attributes)){
            if(value<0) continue;
            gl.enableVertexAttribArray(value);
            const {size,stride,offset} = finder.schema.find(({attribute})=>attribute === key);
            gl.vertexAttribPointer(value,parseInt(size), gl.FLOAT, false, parseInt(stride), parseInt(offset));
        }
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    delete(gl){
        gl.deleteBuffer(this.dataBuffer);
        gl.deleteVertexArray(this.vao)
        this.vao = null;
        this.dataBuffer= null;
        this.name= null;
        this.schema= null;

    }


}
