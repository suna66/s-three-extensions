# `Raycast` Class Interface Specification

## 1. Overview
`Raycast` wraps `THREE.Raycaster` to perform pointer-based raycasting against Three.js `Object3D` targets from screen (client) coordinates relative to a DOM element.

* **Dependencies:** `three`
* **Export Format:** `export default class Raycast`, re-exported as `Raycast` from `src/s-three-extensions/index.ts`

---

## 2. Constructor

### `constructor(dom: HTMLElement, camera: THREE.Camera)`
Creates an internal `THREE.Raycaster` bound to the given DOM element and camera.

* **Parameters:**
  * `dom` (`HTMLElement`): The element whose bounding client rect is used to normalize pointer coordinates (typically `this.domElement`).
  * `camera` (`THREE.Camera`): The camera from which rays are cast.

---

## 3. Methods

### `mousePoint(x: number, y: number, objects: Array<THREE.Object3D>, recursive: boolean = true): THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]`
Converts client coordinates `(x, y)` (such as `PointerEvent.clientX` and `PointerEvent.clientY`) to Normalized Device Coordinates (NDC) using `dom.getBoundingClientRect()`, updates the camera's world matrix, and tests ray intersections against `objects`.

* **Parameters:**
  * `x` (`number`): Client X coordinate.
  * `y` (`number`): Client Y coordinate.
  * `objects` (`Array<THREE.Object3D>`): Target objects to test for intersection.
  * `recursive` (`boolean`, optional, default: `true`): If `true`, also checks descendants of each object.
* **Returns:** An array of `THREE.Intersection` results sorted by distance.

---

## 4. Usage Example

```typescript
import * as THREE from "three";
import {
    Raycast,
    SceneController,
    SceneObject,
    StudioControls,
} from "./src/s-three-extensions";

class PickingScene extends SceneController {
    private box: SceneObject | null = null;

    public start(): void {
        this.controller = new StudioControls(this.camera, this.domElement);
        this.box = new SceneObject(
            new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshNormalMaterial(),
            ),
        );
        this.addMesh(this.box);

        const ray = new Raycast(this.domElement, this.camera);
        const targets: THREE.Object3D[] = [this.box.mesh!];

        this.controller.mouseMoveEvent = (event: PointerEvent) => {
            const intersects = ray.mousePoint(
                event.clientX,
                event.clientY,
                targets,
                false,
            );
            if (intersects.length > 0) {
                console.log("Hit!", intersects[0]);
            }
        };
    }

    public update(_delta: number): void {}

    public override delete(): void {
        this.removeAllMesh();
        this.box?.dispose(true);
    }
}
```
