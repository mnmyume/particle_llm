import glsl from "./vite-plugin-glsl.js";
import {defineConfig} from "vite";
import Inspect from 'vite-plugin-inspect';
export default defineConfig({
    plugins: [
        {...Inspect({
                build: true,
                outputDir: '.vite-inspect'
            })},
        {... glsl({include:'./**/*.glsl'}), enforce:'pre'}
    ],
});
