import {$assert} from "./common.js";

window.__textures = {};
export default class Texture2D {
    texture = null;
    name = null;
    params = null;
    path = null;
    image = null;
    width = null;
    height = null;
    type = "2DTexture";
    constructor(name, params={}) {
        this.name = name;
        this.params = params || null;
        this.wrapS = params.wrapS || 'CLAMP_TO_EDGE';
        this.wrapT = params.wrapT || 'CLAMP_TO_EDGE';
        this.scaleDown = params.scaleDown || 'NEAREST';
        this.scaleUp = params.scaleUp || 'NEAREST';
        this.generateMipMap = params.generateMipMap || false;

        this.width = this.params?.width??512;
        this.height = this.params?.height??512;


    }
    delete() {
        delete __textures[this.name];
        this.texture = null;
        this.name = null;
        this.type = null;
        this.image = null;
        this.params = null;
    }


    initialize({ gl }) {

        this.image = this.params?.image??null;
        this.data = this.params?.data??null;

        $assert(
            this.data == null||
            this.data instanceof Float32Array||
            (this.image instanceof Image ||
                this.image instanceof HTMLCanvasElement));


        __textures[this.name] = {img:this.image, name:this.name};

        this.texture = gl.createTexture();

        this.setFilter(gl);
        this.setData(gl, this.image||this.data);
    }

    setFilter (gl) {

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        $assert(this.texture);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        //WARPPing
        //doesnt work with non-power of 2
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        //work with non-power of 2
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[this.wrapS]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[this.wrapT]);

        if (this.generateMipMap)
            gl.generateMipmap(gl.TEXTURE_2D);

        gl.getExtension('OES_texture_float_linear');

        //FILTERing
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[this.scaleDown]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[this.scaleUp]);



        gl.bindTexture(gl.TEXTURE_2D, null);


    };

    setData(gl,data){

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        if(data instanceof Image || data instanceof HTMLCanvasElement){
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
            this.width = data.width;
            this.height = data.height;
        }else{
            $assert(this.width && this.height);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);

        }
        gl.bindTexture(gl.TEXTURE_2D, null);

    }
}
