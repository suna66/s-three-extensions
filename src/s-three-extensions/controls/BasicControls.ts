import AbstractControls, { type MouseButtons } from "./AbstractControls";
import * as THREE from "three";

export default class BasicControls extends AbstractControls {
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

    protected keyEvent(delta: number) {
        this.handleFlyThroughKeys(delta);
    }
}
