import AbstractControls, { type MouseButtons } from "./AbstractControls";
import * as THREE from "three";

export default class BasicControls extends AbstractControls {
    protected _cameraSpeed: number = 5;
    protected _rotateSpeed: number = 1.5;
    protected _mouseSensitivity: number = 0.003;

    constructor(camera: THREE.Camera, dom: HTMLCanvasElement) {
        super(camera, dom);

        this.setupEvents();
    }

    protected defaultMode(): MouseButtons {
        return {
            LEFT: null,
            MIDDLE: null,
            RIGHT: null,
        };
    }

    protected cameraMove(
        direction: "UP" | "RIGHT" | "FORWARD",
        moveSpeed: number,
    ) {
        const prevPosition = this._camera.position.clone();

        this._camera.getWorldDirection(this._forward);
        this._right.crossVectors(this._forward, this._camera.up).normalize();

        if (direction == "FORWARD")
            this._camera.position.addScaledVector(this._forward, moveSpeed);
        if (direction == "RIGHT")
            this._camera.position.addScaledVector(this._right, moveSpeed);
        if (direction == "UP") this._camera.translateY(moveSpeed);

        const deltaMove = this._camera.position.clone().sub(prevPosition);
        this._controls.target.add(deltaMove);
    }

    protected cameraRotate(yawDelta: number, pitchDelta: number) {
        const targetDistance = this._camera.position.distanceTo(
            this._controls.target,
        );

        this._euler.setFromQuaternion(this._camera.quaternion);

        this._euler.y += yawDelta;
        this._euler.x += pitchDelta;

        const maxPitch = Math.PI / 2 - 0.01;
        this._euler.x = Math.max(-maxPitch, Math.min(maxPitch, this._euler.x));

        this._camera.quaternion.setFromEuler(this._euler);

        this._camera.getWorldDirection(this._forward);
        this._controls.target
            .copy(this._camera.position)
            .addScaledVector(this._forward, targetDistance);
    }

    protected keyEvent(delta: number) {
        if (this._pressKeys.has("KeyW")) {
            //forward
            this.cameraMove("FORWARD", this._cameraSpeed * delta);
        }
        if (this._pressKeys.has("KeyS")) {
            //backward
            this.cameraMove("FORWARD", -this._cameraSpeed * delta);
        }
        if (this._pressKeys.has("KeyA")) {
            //left
            this.cameraMove("RIGHT", -this._cameraSpeed * delta);
        }
        if (this._pressKeys.has("KeyD")) {
            //right
            this.cameraMove("RIGHT", this._cameraSpeed * delta);
        }
        if (this._pressKeys.has("KeyQ")) {
            //up
            this.cameraMove("UP", this._cameraSpeed * delta);
        }
        if (this._pressKeys.has("KeyE")) {
            //down
            this.cameraMove("UP", -this._cameraSpeed * delta);
        }

        if (this._pressKeys.has("ArrowLeft")) {
            this.cameraRotate(this._rotateSpeed * delta, 0);
        }
        if (this._pressKeys.has("ArrowRight")) {
            this.cameraRotate(-this._rotateSpeed * delta, 0);
        }
        if (this._pressKeys.has("ArrowUp")) {
            this.cameraRotate(0, this._rotateSpeed * delta);
        }
        if (this._pressKeys.has("ArrowDown")) {
            this.cameraRotate(0, -this._rotateSpeed * delta);
        }
    }

    public set cameraSpeed(speed: number) {
        this._cameraSpeed = speed;
    }

    public set rotateSpeed(speed: number) {
        this._rotateSpeed = speed;
    }

    public setDamping(factor?: number) {
        if (!this._controls.enableDamping) {
            this._controls.enableDamping = true;
        }
        if (factor == undefined) {
            factor = 0.5;
        }
        this._controls.dampingFactor = factor;
    }

    public disableDamping() {
        this._controls.enableDamping = false;
    }
}
