import * as THREE from "three";
import CustomControls, { type MouseButtons } from "./CustomControls.js";

export default class StudioControls extends CustomControls {
    protected defaultMode(): MouseButtons {
        return {
            LEFT: null,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: null,
        };
    }
}
