import {$assert,$match} from "./common.js";
import Texture2D from './texture2d.js';


export default class Material {
    name = null;
    uniforms = null;
    textures = {};
    shaderProgram = null;
    shader = null;
    dataLocation = {
        attributes: {},
        uniforms: {},
    };
    constructor(name,params = {}) {
        this.name = name;
        this.shader = params.shader || null;
        this.blend = params.blend || 0;
    }


    initialize({ gl }) {

        this.attributes = JSON.parse(JSON.stringify(this.shader.attributes));
        this.uniforms = JSON.parse(JSON.stringify(this.shader.uniforms));

        this.vertex = this.shader.vertex;
        this.fragment = this.shader.fragment;

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, this.vertex);
        gl.attachShader(this.shaderProgram, this.fragment);


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

    setTexture(key, texture){


        if(/\[(\d)+\]/.test(key)){
            $assert(texture instanceof Texture2D);
            let index;
            [,key, index] = $match(/(.+)\[(\d+)\]/gm,key);
            this.textures[key] = this.textures[key]??[];
            this.textures[key][index] = texture;
        } else if(Array.isArray(texture)){
            this.textures[key] = this.textures[key]??[];
            for(const index in texture)
                this.textures[key][index] = texture[index];

        } else{
            $assert(texture instanceof Texture2D);
            this.textures[key] = texture;
        }

        $assert(this.uniforms[key]);
    }

    setUniform(key, value){
        if(/\[(\d)+\]/.test(key)){
            if(!Array.isArray(value))
                value = [value];


            let index;
            [,key, index] = key.match(/(.+)\[(\d+)\]/);
            const length = this.uniforms[key].length;
            $assert(value.length === length, 'value length err');
            const startIndex = index*length;
            $assert(typeof (this.uniforms[key].value[startIndex]) === 'number', 'index err');

            this.uniforms[key].value.splice(index*length, length, ...value);
        }else
            this.uniforms[key].value = value;
    }



    preDraw(gl, camera, transform) {

        if(this.blend) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.blendEquation(gl.FUNC_ADD);
        }

        gl.useProgram(this.shaderProgram);
        const setTex =
            (value, texIndex)=>{
                    gl.activeTexture(gl[`TEXTURE${texIndex}`]);
                    let TYPE;
                    if(value.type === "2DTexture")
                        TYPE = gl.TEXTURE_2D;
                    else if(value.type === "3DTexture")
                        TYPE = gl.TEXTURE_CUBE_MAP;
                    else
                        $assert(false);
                    gl.bindTexture(TYPE, value.texture);
                };
        for(const [key,value] of Object.entries(this.textures)){
            if(Array.isArray(value)){
                for(const index in value){
                    const texIndex = this.uniforms[key].value[index];
                    setTex(value[index], texIndex);
                }

            }else{
                const texIndex = this.uniforms[key].value;
                setTex(value, texIndex);
            }
        }

        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        // gl.blendEquation(gl.FUNC_ADD);

        const PRESERVED_UNIFORM = ["_uni_projMat", "_uni_viewMat", "_uni_modelMat"];

        for(const name in this.uniforms){
            if(!this.dataLocation.uniforms[name])
                continue;

            const {type, length = 1, value} = this.uniforms[name];
            $assert(typeof length === 'number');
            const isSingleVar = input => /bool|int|float|sampler2D|samplerCube/.test(input),
                    isArr = input=>/\[\]/.test(input),

                 setGLValue = (name, type, value)=>{
                        if(/vec/.test(type)){

                             $assert(value, 'empty uniform vec');

                             const [,dim] = type.match(/vec(\d+)/);
                            if(type.startsWith('i'))
                                gl[`uniform${dim}i`](this.dataLocation.uniforms[name], ...value);
                            else
                                gl[`uniform${dim}f`](this.dataLocation.uniforms[name], ...value);

                        }else if(/mat/.test(type)){
                             if(!PRESERVED_UNIFORM.includes(name))
                                 $assert(value, 'empty uniform vec');

                             if(value){
                                 const [,dim] = type.match(/mat(\d+)/);
                                 gl[`uniformMatrix${dim}fv`](this.dataLocation.uniforms[name], false, value);
                             }

                        } else { //if(isSingleVar(type))
                             const fncName = `uniform1${/float/.test(type)?'f':'i'}`;

                             if(Array.isArray(value)) value = value[0];

                             gl[fncName](this.dataLocation.uniforms[name],value);


                        }
                };


            if(isArr(type)){
                for(let index =0; index < value.length; index += length){
                    setGLValue(`${name}[${Math.floor(index/length)}]`,type, value.slice(index,index+length));
                }
            }else
                setGLValue(name,type, value);

        }

        if (this.dataLocation.uniforms["_uni_projMat"] && camera) {
            gl.uniformMatrix4fv(this.dataLocation.uniforms["_uni_projMat"], false, camera.projectionMatrix);
        }
        if (this.dataLocation.uniforms["_uni_viewMat"] && camera) {
            gl.uniformMatrix4fv(this.dataLocation.uniforms["_uni_viewMat"], false, camera.viewMatrix);
        }
        if (this.dataLocation.uniforms["_uni_modelMat"] && transform) {
            gl.uniformMatrix4fv(this.dataLocation.uniforms["_uni_modelMat"], false, transform.getMatrix());
        }





        if (this.dataLocation.uniforms["uVInverseMatrix"] && camera) {
            gl.uniformMatrix4fv(this.dataLocation.uniforms["uVInverseMatrix"], false, camera.viewInverseMatrix);
        }

        if(this.dataLocation.uniforms["_uni_normalMat"]){
            //transform
            //http://stackoverflow.com/questions/5255806/how-to-calculate-tangent-and-binormal
            //http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/

            // mat4.multiply(tmpMat4, cam.GetViewMatrix(), this.worldMatrix);
            // mat4.invert(tmpMat4,tmpMat4);
            // mat3.fromMat4(tmpMat3,tmpMat4);
            // mat3.transpose(tmpMat3,tmpMat3);

            //((camMat * worldMat)^-1)^T
            //(worldMat^-1 * camMat^T)^T
            //camMat * ((RS)^-1)^T
            //camMat * R * S^-1
            const tmpMat3 = math.mat3.create(),
                viewMat3 = math.mat3.create();
            math.mat3.fromMat4(viewMat3,cam.viewMatrix);
            math.mat3.multiply(tmpMat3, viewMat3, transform.rotationMatrix);

            let [sx, sy, sz]  = transform.scale;
            const sxInv = sx==0?Math.maxInt:1/sx,
                syInv = sy==0?Math.maxInt:1/sy,
                szInv = sz==0?Math.maxInt:1/sz;
            tmpMat3[0]*=sxInv;
            tmpMat3[4]*=syInv;
            tmpMat3[8]*=szInv;

            gl.uniformMatrix3fv(this.dataLocation.uniforms["_uni_normalMat"], false, tmpMat3);
        }

    }

    postDraw(gl){
        gl.useProgram(null);
        for(const [key,value] of Object.entries(this.textures)){
            if(Array.isArray(value)){
                for(const index in value){
                    const texIndex = this.uniforms[key].value[index];
                    gl.activeTexture(gl[`TEXTURE${texIndex}`]);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
            }else{
                const texIndex = this.uniforms[key].value;
                gl.activeTexture(gl[`TEXTURE${texIndex}`]);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

        }
        if(this.blend) {
            gl.disable(gl.BLEND);
        }
    }
}
