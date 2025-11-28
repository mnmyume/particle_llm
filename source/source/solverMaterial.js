import Material from "./material.js";

export default class SolverMaterial extends Material {
    varyings = null;
    constructor(name, params = {}) {
        super(name, params);
    }

    initialize({ gl }) {

        this.attributes = JSON.parse(JSON.stringify(this.shader.attributes));
        this.uniforms = JSON.parse(JSON.stringify(this.shader.uniforms));

        this.vertex = this.shader.vertex;
        this.fragment = this.shader.fragment;

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, this.vertex);
        gl.attachShader(this.shaderProgram, this.fragment);


        // transform feedback
        this.varyings = Object.keys(this.shader.vertSrc.output);
        gl.transformFeedbackVaryings(this.shaderProgram, this.varyings, gl.INTERLEAVED_ATTRIBS);


        gl.linkProgram(this.shaderProgram);
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(this.shaderProgram);
            throw new Error("Could not compile WebGL program. \n\n" + info);
        }

        for (const attr in this.attributes) {
            this.dataLocation.attributes[attr] = gl.getAttribLocation(this.shaderProgram, attr);
        }

        for (let name in this.uniforms) {
            let {type, value, length = 1} = this.uniforms[name];
            const isArr = /\[\]/.test(type);
            if(isArr){

                for(let index =0; index < value.length; index += length){
                    const key = `${name}[${index/length}]`;
                    this.dataLocation.uniforms[key] = gl.getUniformLocation(this.shaderProgram, key);
                    this.uniforms[name].length = length;
                }
            }

            this.dataLocation.uniforms[name] = gl.getUniformLocation(this.shaderProgram, name);
        }
    }


    setTexture(key, texture) {
        super.setTexture(key, texture);
    }


    setUniform(key, value) {
        super.setUniform(key, value);
    }


    preDraw(gl, camera, transform) {
        super.preDraw(gl, camera, transform);
    }


    postDraw(gl) {
        super.postDraw(gl);
    }
}