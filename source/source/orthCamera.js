import Camera from "./camera.js"

function $ortho(left, right, bottom, top, near, far) {
    const   lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);

    const out =
        [-2 * lr,                       0,                   0,                 0,
            0,                      -2 * bt,                 0,                 0,
            0,                          0,                  2 * nf,             0,
            (left + right) * lr,   (top + bottom) * bt,   (far + near) * nf,    1];

    return out;
}

export default class OrthCamera extends Camera {

    constructor({ widthSpan = 10, aspect = 1, position = [0, 0, 5], target = [0, 0, 0], up = [0, 1, 0], near = 0.001, far = 1000 }) {
        super({ position, target, up, near, far });
        this.widthSpan = widthSpan;
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
        const height = this.widthSpan / this.aspect;
        this.left = -this.widthSpan * 0.5;
        this.right = this.widthSpan * 0.5;
        this.bottom = 0;
        this.top = height;
        this.projectionMatrix = $ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }

    setAspect(aspect) {
        this.aspect = aspect;
        this.updateProjection();
    }

}

