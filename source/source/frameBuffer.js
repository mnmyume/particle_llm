import Texture2D from "./texture2d.js";
import {$assert} from "./common.js";

export default class FrameBuffer{

    textures = [];
    constructor(name = 'frameBuffer', params) {
        this.name = name;
        this.params = params??{width:512,height:512};
        this.width = params.width??512;
        this.height = params.height??512;
    }

    initialize({ gl }) {
        this.framebuffer = gl.createFramebuffer();

        this.textures = [
            new Texture2D(`${this.name}-tex0`,this.params),
            new Texture2D(`${this.name}-tex1`,this.params),
            new Texture2D(`${this.name}-tex2`,this.params),
            new Texture2D(`${this.name}-tex3`,this.params)
        ];
        for(const tex of this.textures)
            tex.initialize({gl});

        const ext =  gl.getExtension("WEBGL_draw_buffers");
        $assert(ext);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT0_WEBGL,
            gl.TEXTURE_2D,
            this.textures[0].texture,
            0,
        );
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT1_WEBGL,
            gl.TEXTURE_2D,
            this.textures[1].texture,
            0,
        );
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT2_WEBGL,
            gl.TEXTURE_2D,
            this.textures[2].texture,
            0,
        );
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT3_WEBGL,
            gl.TEXTURE_2D,
            this.textures[3].texture,
            0,
        );
        this.ext = ext;
        ext.drawBuffersWEBGL([
            ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
            ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
            ext.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
            ext.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3]
        ]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    delete(gl){
        const  ext = this.ext ;
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT0_WEBGL,
            gl.TEXTURE_2D,
            null,
            0,
        );
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT1_WEBGL,
            gl.TEXTURE_2D,
            null,
            0,
        );
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT2_WEBGL,
            gl.TEXTURE_2D,
            null,
            0,
        );
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext.COLOR_ATTACHMENT3_WEBGL,
            gl.TEXTURE_2D,
            null,
            0,
        );
    }

}