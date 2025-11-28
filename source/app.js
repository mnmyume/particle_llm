import Camera from './source/camera.js';
import OrthCamera from "./source/orthCamera.js";
import PerspCamera from "./source/perspCamera.js";
import Transform from './source/transform.js';
import Time from './source/time.js';

import { initQuad }from "../demo/quad.js";
import { initSnow }from "../demo/snow.js";
import { initArrows } from "../demo/arrows.js";
import { initRain } from "../demo/rain.js";
import { initLeaves } from "../demo/leaves.js";
import { initFlowers } from "../demo/flowers.js";


const effects = {
    quad: initQuad,
    snow: initSnow,
    arrows: initArrows,
    rain: initRain,
    leaves: initLeaves,
    flowers: initFlowers
};

function main() {

    const canvas = document.getElementById('game-surface');
    const gl = canvas.getContext('webgl2');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // init camera
    const camera = new OrthCamera({
        widthSpan: 70,
        aspect: canvas.width / canvas.height });
    // const camera = new PerspCamera({
    //     target:[0,10,0]
    // });
    const r = 700,
        cos45 = Math.cos(45 * Math.PI / 180),
        sin35 = Math.sin(35 * Math.PI / 180);
    camera.setPosition([r * cos45, r * sin35, r * cos45]);
    camera.updateProjection();
    camera.updateView();
    camera.updateViewInverse();


    switchEffect("leaves");

    function switchEffect(name) {
        const fx = effects[name];
        if (fx) {
            console.log(`Switching to "${name}"`);
            fx(gl, canvas, camera);
        } else {
            console.warn(`"${name}" doesn’t exist.`);
        }
    }

    window.switchEffect = switchEffect;

}


main();
