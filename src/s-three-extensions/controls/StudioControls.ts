import AbstractControls, { type MouseButtons } from "./AbstractControls";
import * as THREE from "three";

export default class StudioControls extends AbstractControls {
    protected _mouseSensitivity: number = 0.003;
    protected _isFlyThroughMode: boolean = false;
    protected _isRightDragging: boolean = false;

    constructor(camera: THREE.Camera, dom: HTMLCanvasElement) {
        super(camera, dom);

        this.setupEvents();
    }

    protected defaultMode(): MouseButtons {
        return {
            LEFT: null,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: null,
        };
    }

    protected alternativeMode(): MouseButtons {
        return {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: null,
        };
    }

    protected override handleMouseDown = (e: PointerEvent) => {
        if (this._mouseDownEvent) this._mouseDownEvent(e);
        const btn = e.button;
        if (btn == 2) {
            this._isRightDragging = true;
            this._dom.setPointerCapture(e.pointerId);
        }
    };

    protected override handleMouseMove = (e: PointerEvent) => {
        if (this._mouseMoveEvent) this._mouseMoveEvent(e);
        if (!this._isRightDragging) return;

        const yawDelta = -e.movementX * this._mouseSensitivity;
        const pitchDelta = -e.movementY * this._mouseSensitivity;

        this.cameraRotate(yawDelta, pitchDelta);
    };

    protected override handleMouseUp = (e: PointerEvent) => {
        if (this._mouseUpEvent) this._mouseUpEvent(e);
        const btn = e.button;
        if (btn == 2) {
            this._isRightDragging = false;
            if (this._dom.hasPointerCapture(e.pointerId)) {
                this._dom.releasePointerCapture(e.pointerId);
            }
        }
    };

    protected keyEvent(delta: number) {
        const shouldFlyThrough =
            this._pressKeys.has("AltLeft") || this._isRightDragging;
        if (shouldFlyThrough && !this._isFlyThroughMode) {
            this._isFlyThroughMode = true;
            this._controls.mouseButtons = this.alternativeMode();
        }
        if (!shouldFlyThrough && this._isFlyThroughMode) {
            this._isFlyThroughMode = false;
            this._controls.mouseButtons = this.defaultMode();
        }
        if (this._isFlyThroughMode) {
            this.handleFlyThroughKeys(delta);
        }
    }
}
