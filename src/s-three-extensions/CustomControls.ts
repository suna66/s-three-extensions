import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type MouseButtons = {
    LEFT: THREE.MOUSE | null;
    MIDDLE: THREE.MOUSE | null;
    RIGHT: THREE.MOUSE | null;
};

const DEFAULT_MOUSE = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: null,
};

export default class CustomControls {
    protected readonly _camera: THREE.Camera;
    protected readonly _dom: HTMLElement;
    protected _controls: OrbitControls;
    protected _isFlayThroughMode: boolean = false;
    protected _isRightDragging: boolean = false;
    protected _pressKeys: Set<string>;
    protected _cameraSpeed: number = 5;
    protected _rotateSpeed: number = 1.5;
    protected _mouseSensitivity: number = 0.003;

    protected _direction = new THREE.Vector3();
    protected _forward = new THREE.Vector3();
    protected _right = new THREE.Vector3();
    protected _euler = new THREE.Euler(0, 0, 0, "YXZ");

    constructor(camera: THREE.Camera, dom: HTMLElement) {
        this._camera = camera;
        this._dom = dom;
        this._isFlayThroughMode = false;
        this._pressKeys = new Set<string>();

        this._controls = new OrbitControls(camera, dom);
        this.setupControlOptions();

        this.setupEvents();

        this._controls.update();
    }

    protected defaultMode(): MouseButtons {
        return DEFAULT_MOUSE;
    }

    protected alternativeMode() {
        return DEFAULT_MOUSE;
    }

    protected setupControlOptions() {
        this._controls.mouseButtons = this.defaultMode();
        this._camera.getWorldDirection(this._direction);

        this._controls.target.copy(this._camera.position).add(this._direction);
    }

    protected handleMouseDown = (e: PointerEvent) => {
        const btn = e.button;
        if (btn == 2) {
            this._isRightDragging = true;
            this._dom.setPointerCapture(e.pointerId);
        }
    };

    protected handleMouseMove = (e: PointerEvent) => {
        if (!this._isRightDragging) return;

        const yawDelta = -e.movementX * this._mouseSensitivity;
        const pitchDelta = -e.movementY * this._mouseSensitivity;

        this.cameraRotate(yawDelta, pitchDelta);
    };

    protected handleMouseUp = (e: PointerEvent) => {
        const btn = e.button;
        if (btn == 2) {
            this._isRightDragging = false;
            if (this._dom.hasPointerCapture(e.pointerId)) {
                this._dom.releasePointerCapture(e.pointerId);
            }
        }
    };

    protected handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLElement) {
            if (e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA")
                return;
        }
        if (e.key === "Alt") {
            e.preventDefault();
        }
        this._pressKeys.add(e.code);
    };

    protected handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Alt") {
            e.preventDefault();
        }
        if (this._pressKeys.has(e.code)) this._pressKeys.delete(e.code);
    };

    protected handleBlur = () => {
        this._pressKeys.clear();
        this._isFlayThroughMode = false;
        this._controls.mouseButtons = this.defaultMode();
    };

    protected handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    protected setupEvents() {
        this._dom.addEventListener("pointerdown", this.handleMouseDown, {
            capture: true,
        });
        this._dom.addEventListener("pointermove", this.handleMouseMove);
        this._dom.addEventListener("contextmenu", this.handleContextMenu);

        addEventListener("pointerup", this.handleMouseUp);
        addEventListener("keydown", this.handleKeyDown);
        addEventListener("keyup", this.handleKeyUp);
        addEventListener("blur", this.handleBlur);
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
        const shouldFlayThrough =
            this._pressKeys.has("AltLeft") || this._isRightDragging;
        if (shouldFlayThrough && !this._isFlayThroughMode) {
            this._isFlayThroughMode = true;
            this._controls.mouseButtons = this.alternativeMode();
        }
        if (!shouldFlayThrough && this._isFlayThroughMode) {
            this._isFlayThroughMode = false;
            this._controls.mouseButtons = this.defaultMode();
        }
        if (this._isFlayThroughMode) {
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

    public dispose() {
        this._dom.removeEventListener("pointerdown", this.handleMouseDown);
        this._dom.removeEventListener("pointermove", this.handleMouseMove);
        this._dom.removeEventListener("contextmenu", this.handleContextMenu);
        removeEventListener("pointerup", this.handleMouseUp);
        removeEventListener("keydown", this.handleKeyDown);
        removeEventListener("keyup", this.handleKeyUp);
        removeEventListener("blur", this.handleBlur);
    }

    public update(delta: number) {
        this.keyEvent(delta);
        this._controls.update();
    }
}
