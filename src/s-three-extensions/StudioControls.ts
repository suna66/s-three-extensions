import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// default mode of mouse control
const DefaultMode = {
    LEFT: null,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: null,
};

// play through mode when alt key pressed
const FlayThroughMode = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: null,
};

export default class StudioControls {
    private readonly _camera: THREE.Camera;
    private readonly _dom: HTMLElement;
    private _controls: OrbitControls;
    private _isFlayThroughMode: boolean = false;
    private _isRightDragging: boolean = false;
    private _pressKeys: Set<string>;
    private _cameraSpeed: number = 5;
    private _rotateSpeed: number = 1.5;
    private _mouseSensitivity: number = 0.003;

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

    private setupControlOptions() {
        this._controls.mouseButtons = DefaultMode;
        const direction = new THREE.Vector3();
        this._camera.getWorldDirection(direction);

        this._controls.target.copy(this._camera.position).add(direction);
    }

    private handleMouseDown = (e: PointerEvent) => {
        const btn = e.button;
        if (btn == 2) {
            this._isRightDragging = true;
            this._dom.setPointerCapture(e.pointerId);
        }
    };

    private handleMouseMove = (e: PointerEvent) => {
        if (!this._isRightDragging) return;

        const yawDelta = -e.movementX * this._mouseSensitivity;
        const pitchDelta = -e.movementY * this._mouseSensitivity;

        this.cameraRotate(yawDelta, pitchDelta);
    };

    private handleMouseUp = (e: PointerEvent) => {
        const btn = e.button;
        if (btn == 2) {
            this._isRightDragging = false;
            if (this._dom.hasPointerCapture(e.pointerId)) {
                this._dom.releasePointerCapture(e.pointerId);
            }
        }
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLElement) {
            if (e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA")
                return;
        }
        if (e.key === "Alt") {
            e.preventDefault();
        }
        this._pressKeys.add(e.code);
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Alt") {
            e.preventDefault();
        }
        if (this._pressKeys.has(e.code)) this._pressKeys.delete(e.code);
    };

    private handleBlur = () => {
        this._pressKeys.clear();
        this._isFlayThroughMode = false;
        this._controls.mouseButtons = DefaultMode;
    };

    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    private setupEvents() {
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

    private cameraMove(
        direction: "UP" | "RIGHT" | "FORWARD",
        moveSpeed: number,
    ) {
        const prevPosition = this._camera.position.clone();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        this._camera.getWorldDirection(forward);
        right.crossVectors(forward, this._camera.up).normalize();

        if (direction == "FORWARD")
            this._camera.position.addScaledVector(forward, moveSpeed);
        if (direction == "RIGHT")
            this._camera.position.addScaledVector(right, moveSpeed);
        if (direction == "UP") this._camera.translateY(moveSpeed);

        const deltaMove = this._camera.position.clone().sub(prevPosition);
        this._controls.target.add(deltaMove);
    }

    private cameraRotate(yawDelta: number, pitchDelta: number) {
        const targetDistance = this._camera.position.distanceTo(
            this._controls.target,
        );

        const euler = new THREE.Euler(0, 0, 0, "YXZ");
        euler.setFromQuaternion(this._camera.quaternion);

        euler.y += yawDelta;
        euler.x += pitchDelta;

        const maxPitch = Math.PI / 2 - 0.01;
        euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));

        this._camera.quaternion.setFromEuler(euler);

        const forward = new THREE.Vector3();
        this._camera.getWorldDirection(forward);
        this._controls.target
            .copy(this._camera.position)
            .addScaledVector(forward, targetDistance);
    }

    private keyEvent(delta: number) {
        const shouldFlayThrough =
            this._pressKeys.has("AltLeft") || this._isRightDragging;
        if (shouldFlayThrough && !this._isFlayThroughMode) {
            this._isFlayThroughMode = true;
            this._controls.mouseButtons = FlayThroughMode;
        }
        if (!shouldFlayThrough && this._isFlayThroughMode) {
            this._isFlayThroughMode = false;
            this._controls.mouseButtons = DefaultMode;
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
