import {$assert, $getShaderInfo} from "./common.js";


const DERIVATIVES = {
    GL_EXT_draw_buffers:'WEBGL_draw_buffers',
    GL_OES_standard_derivatives:'OES_standard_derivatives',
    GL_OES_texture_float:'OES_texture_float',
    GL_OES_texture_float_linear:'OES_texture_float_linear',
}

export default class Shader {
    constructor(params = {}) {
        this.name = params.name ?? 'defaultShader';
        this.vertSrc = params.vertexSource ?? null;
        this.fragSrc = params.fragmentSource ?? null;
        this.initValues = params.initValues ?? {};
        this.dataLocation = { attributes: {}, uniforms: {} };
        this.params = params;
    }

    initialize ({ gl }) {

        // const shaders = preprocess({
        //     vertex:this.vertSrc,
        //     fragment:this.fragSrc,
        //     init:this.initValues,
        // });

        const attributes = this.vertSrc.input;
        const uniforms = {...this.vertSrc.uniform, ...this.fragSrc.uniform};
        const extension = {...this.vertSrc.extension,...this.fragSrc.extension};
        this.fragment = gl.createShader(gl.FRAGMENT_SHADER);
        this.vertex =gl.createShader(gl.VERTEX_SHADER);

        this.attributes = attributes;
        this.uniforms = uniforms;
        this.extension = extension;
        this.compile(gl, this.params);
    }
    compile(gl,params){
        params = params || {};
        const directives = [
            // '#version 300 es'
            // '#version 100',
            // '#extension GL_EXT_draw_buffers:require', //https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers
            // 'precision mediump float;'
        ];
        for(const ext in this.extension)
            $assert( gl.getExtension(DERIVATIVES[ext]), {msg:`getExtension(${ext}) is not supported`})



        for(const i in (params.defines || [])){
            directives.push('#define ' + params.defines[i]);
        }


        const shaders = [
            {shader:this.fragment, source:this.fragSrc},
            {shader:this.vertex,source:this.vertSrc}
        ];
        for(let {shader,source} of shaders){
            const {version,attribute, uniform,extension, code, file} = source;
            const ext = [];
            for (const [key, value] of Object.entries(extension))
                ext.push(`#extension ${key}:${value}`);

            let ver = '';
            if(version === 'GLSL ES 3.00')
                ver = '#version 300 es';

            gl.shaderSource(shader, ([ver,...directives,...ext].join('\n') + '\n').concat(code));
            gl.compileShader(shader);
            $assert(gl.getShaderParameter(shader, gl.COMPILE_STATUS), $getShaderInfo(this.name,gl,shader,file));
        }
    };
}
