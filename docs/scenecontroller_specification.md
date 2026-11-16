# `SceneController` Class Interface Specification

## 1. Overview
`SceneController` is an abstract base class for a scene managed by `ThreeSpace`. It owns a `THREE.Scene`, provides access to the associated `ThreeSpace` camera and canvas, and defines the scene start and per-frame update hooks.

* **Dependencies:** `three/webgpu`, `ThreeSpace`
* **Export Format:** `export class SceneController` (named export)

---

## 2. Lifecycle

1. Construct a subclass; the base constructor creates an empty `THREE.Scene`.
2. `ThreeSpace.start(controller)` initializes the renderer, then calls `controller.init(space)` and `controller.start()`.
3. For each rendered frame, `ThreeSpace` calls `controller.update(delta)` before rendering `controller.scene` with the associated camera. `delta` is elapsed time in seconds since the previous frame.
4. `ThreeSpace.delete()` calls `controller.delete()` for the active controller.

The `camera` and `domElement` getters require `init(space)` to have run. Accessing them before initialization dereferences a `null` space and will fail.

---

## 3. Properties (Getters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `scene` | `THREE.Scene` | Read-only | The scene owned by this controller. |
| `camera` | `THREE.Camera` | Read-only | The camera from the initialized `ThreeSpace`. |
| `domElement` | `HTMLCanvasElement` | Read-only | The renderer canvas from the initialized `ThreeSpace`. |

---

## 4. Methods

### `constructor()`
Creates an empty `THREE.Scene`. Subclasses may use the implicit base constructor or define their own constructor and call `super()`.

---

### `init(space: ThreeSpace): void`
Stores the `ThreeSpace` instance associated with this controller. Normally called by `ThreeSpace.start()`; call it before accessing `camera` or `domElement` when managing a controller outside that flow.

* **Parameters:** `space` is the owning `ThreeSpace` instance.
* **Returns:** `void`

---

### `abstract start(): void`
Called once by `ThreeSpace.start()` after `init()`. Implement this method to create and add the scene's initial objects.

* **Returns:** `void`

---

### `abstract update(delta: number): void`
Called before each render while the `ThreeSpace` animation loop is active.

* **Parameters:** `delta` is elapsed time in seconds since the previous frame.
* **Returns:** `void`

---

### `delete(): void`
Optional cleanup hook called by `ThreeSpace.delete()` for the active controller. The base implementation does nothing; subclasses can override it to release their resources.

* **Returns:** `void`

---

### `protected addMesh(mesh: THREE.Mesh): void`
Adds the mesh directly to the controller's scene. This helper is available to subclasses and is not public API on `ThreeSpace`.

* **Parameters:** `mesh` is the mesh to add.
* **Returns:** `void`

---

### `protected removeMesh(mesh: THREE.Mesh, disposed: boolean = false): void`
Removes the mesh directly from the controller's scene. When `disposed` is `true`, disposes of the mesh geometry and its material (or each material when the material is an array). It does not dispose textures or recursively dispose child objects.

* **Parameters:**
  * `mesh`: The mesh to remove.
  * `disposed`: Whether to dispose the mesh geometry and material; defaults to `false`.
* **Returns:** `void`

---

## 5. Usage Example

```typescript
import * as THREE from "three/webgpu";
import { SceneController } from "./SceneController";

export class SampleScene extends SceneController {
    private cube: THREE.Mesh | null = null;

    public start(): void {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.addMesh(this.cube);
    }

    public update(delta: number): void {
        if (!this.cube) return;
        this.cube.rotation.x += delta;
        this.cube.rotation.y += delta;
    }

    public override delete(): void {
        if (this.cube) this.removeMesh(this.cube, true);
    }
}
```
