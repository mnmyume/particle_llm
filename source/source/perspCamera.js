import Camera from "./camera.js"

function $perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan((fov * Math.PI) / 360);
    const rangeInv = 1.0 / (near - far);

    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, (near * far * 2) * rangeInv, 0
    ];
}

export default class PerspCamera extends Camera {

    constructor({ fov = 45, aspect = 1, position = [0, 0, 5], target = [0, 0, 0], up = [0, 1, 0], near = 0.001, far = 1000 }) {
        super({ position, target, up, near, far });
        this.fov = fov;
        this.aspect = aspect;
    }

    updateView() {
        super.updateView();
    }

    updateViewInverse() {
        super.updateViewInverse();
    }

    setPosition(position) {
        super.setPosition(position);
    }

    setTarget(target) {
        super.setTarget(target);
    }

    updateProjection() {
        this.projectionMatrix = $perspective(this.fov, this.aspect, this.near, this.far);
    }

    setAspect(aspect) {
        this.aspect = aspect;
        this.updateProjection();
    }

    setFov(fov) {
        this.fov = fov;
        this.updateProjection();
    }

}