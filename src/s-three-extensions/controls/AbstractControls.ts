import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type MouseButtons = {
    LEFT: THREE.MOUSE | null;
    MIDDLE: THREE.MOUSE | null;
    RIGHT: THREE.MOUSE | null;
};

export default abstract class AbstractControls {
    protected readonly _camera: THREE.Camera;
    protected readonly _dom: HTMLElement;
    protected _controls: OrbitControls;
    protected _pressKeys: Set<string>;

    protected _mouseDownEvent: ((e: PointerEvent) => void) | null = null;
    protected _mouseMoveEvent: ((e: PointerEvent) => void) | null = null;
    protected _mouseUpEvent: ((e: PointerEvent) => void) | null = null;

    protected _direction = new THREE.Vector3();
    protected _forward = new THREE.Vector3();
    protected _right = new THREE.Vector3();
    protected _euler = new THREE.Euler(0, 0, 0, "YXZ");

    constructor(camera: THREE.Camera, dom: HTMLElement) {
        this._camera = camera;
        this._dom = dom;
        this._pressKeys = new Set<string>();
        this._controls = new OrbitControls(camera, dom);
        this.setupControlOptions();

        this._controls.update();
    }

    protected defaultMode(): MouseButtons {
        return {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.DOLLY,
        };
    }

    protected set mouseButtons(buttons: OrbitControls["mouseButtons"]) {
        this._controls.mouseButtons = buttons;
    }

    public set mouseDownEvent(func: (e: PointerEvent) => void) {
        this._mouseDownEvent = func;
    }

    public set mouseMoveEvent(func: (e: PointerEvent) => void) {
        this._mouseMoveEvent = func;
    }

    public set mouseUpEvent(func: (e: PointerEvent) => void) {
        this._mouseUpEvent = func;
    }

    protected setupControlOptions() {
        this._controls.mouseButtons = this.defaultMode();
        this._camera.getWorldDirection(this._direction);

        this._controls.target.copy(this._camera.position).add(this._direction);
    }

    protected abstract keyEvent(delta: number): void;

    protected handleMouseDown = (e: PointerEvent) => {
        if (this._mouseDownEvent) this._mouseDownEvent(e);
    };

    protected handleMouseMove = (e: PointerEvent) => {
        if (this._mouseMoveEvent) this._mouseMoveEvent(e);
    };

    protected handleMouseUp = (e: PointerEvent) => {
        if (this._mouseUpEvent) this._mouseUpEvent(e);
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
        this.flash();
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

    public getKeyState(key: string): boolean {
        return this._pressKeys.has(key);
    }

    public flash() {
        this._pressKeys.clear();
        this._controls.mouseButtons = this.defaultMode();
    }

    public dispose() {
        this._dom.removeEventListener("pointerdown", this.handleMouseDown);
        this._dom.removeEventListener("pointermove", this.handleMouseMove);
        this._dom.removeEventListener("contextmenu", this.handleContextMenu);
        removeEventListener("pointerup", this.handleMouseUp);
        removeEventListener("keydown", this.handleKeyDown);
        removeEventListener("keyup", this.handleKeyUp);
        removeEventListener("blur", this.handleBlur);
        this._mouseDownEvent = null;
        this._mouseMoveEvent = null;
        this._mouseUpEvent = null;
    }

    public update(delta: number) {
        this.keyEvent(delta);
        this._controls.update();
    }
}
