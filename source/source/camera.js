import { mat4 } from 'gl-matrix';

export default class Camera {
    constructor({ position = [0, 0, 5], target = [0, 0, 0], up = [0, 1, 0], near = 0.001, far = 1000}) {
        this.position = position;
        this.target = target;
        this.up = up;
        this.near = near;
        this.far = far;

        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        this.viewInverseMatrix = mat4.create();
    }

    updateView() {
        // let view = mat4.create();
        // mat4.lookAt(view, this.position, this.target, this.up);
        // mat4.translate(view, view, [0, 75, 0]);
        // this.viewMatrix = new Float32Array(view);
         this.viewMatrix = new Float32Array(mat4.lookAt(
            this.viewMatrix, this.position, this.target, this.up));
    }

    updateViewInverse() {
        mat4.invert(this.viewInverseMatrix, this.viewMatrix);
    }

    setPosition(position) {
        this.position = position;
        this.updateView();
    }

    setTarget(target) {
        this.target = target;
        this.updateView();
    }

}
