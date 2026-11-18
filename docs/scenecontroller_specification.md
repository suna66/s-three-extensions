# `SceneController` Class Interface Specification

## 1. Overview
`SceneController` is an abstract base class for a scene managed by `ThreeWorld`. It owns a `THREE.Scene`, provides access to the associated `ThreeWorld` camera and canvas, and defines the scene lifecycle hooks.

* **Dependencies:** `three/webgpu`, `ThreeWorld`
* **Export Format:** `export class SceneController` (named export)

---

## 2. Lifecycle

1. Construct a subclass; the base constructor creates an empty `THREE.Scene`.
2. `ThreeWorld.addScene(key, controller)` associates the controller with a key and calls `controller.init(world)`.
3. `ThreeWorld.start(key)` initializes the renderer, calls `start()` on the selected controller, and begins the render loop.
4. A controller can request a transition with its protected `loadScene(key, isDelete)` method. The destination controller is resumed immediately; on the next animation frame the previous controller is either deleted or stopped and suspended, then the destination becomes active. The pressed-key set is cleared during the transition.
5. For each rendered frame, `ThreeWorld` calls the active controller's `update(delta)` before rendering its `scene`. `delta` is elapsed time in seconds since the previous frame.
6. `ThreeWorld.delete()` calls `delete()` on the active controller.

The `camera` and `domElement` getters require `init(space)` to have run. Accessing them before initialization dereferences a `null` space and will fail.

---

## 3. Properties (Getters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `scene` | `THREE.Scene` | Read-only | The scene owned by this controller. |
| `camera` | `THREE.Camera` | Read-only | The camera from the initialized `ThreeWorld`. |
| `domElement` | `HTMLCanvasElement` | Read-only | The renderer canvas from the initialized `ThreeWorld`. |

---

## 4. Methods

### `constructor()`
Creates an empty `THREE.Scene`. Subclasses may use the implicit base constructor or define their own constructor and call `super()`.

---

### `init(world: ThreeWorld): void`
Stores the `ThreeWorld` instance associated with this controller. Called by `ThreeWorld.addScene()`; call it before accessing `camera` or `domElement` when managing a controller outside that flow.

* **Parameters:** `world` is the owning `ThreeWorld` instance.
* **Returns:** `void`

---

### `abstract start(): void`
Called when the controller is first started or resumed after being suspended. Implement this method to create and add the scene's initial objects. On later resumes after suspension, `restart()` is called instead.

* **Returns:** `void`

---

### `abstract update(delta: number): void`
Called before each render while the `ThreeWorld` animation loop is active and this controller is active.

* **Parameters:** `delta` is elapsed time in seconds since the previous frame.
* **Returns:** `void`

---

### `delete(): void`
Optional cleanup hook called when the controller is deleted during a scene transition or when `ThreeWorld.delete()` is called while it is active. The base implementation does nothing; subclasses can override it to release their resources.

* **Returns:** `void`

---

### `stop(): void` and `restart(): void`
Optional lifecycle hooks. `stop()` is called when this controller is switched away from. `restart()` is called when a previously suspended controller is resumed. The base implementations do nothing.

### `protected loadScene(key: string, isDelete: boolean = true): void`
Requests a transition to a controller registered under `key` through the associated `ThreeWorld`. If `isDelete` is `true`, the outgoing controller is deleted and removed from the world's scene registry; otherwise it is suspended and can later be resumed. Does nothing if this controller has not been initialized with a world.

* **Parameters:** `key` is the destination scene key; `isDelete` selects whether the outgoing controller is deleted or suspended.
* **Returns:** `void`

---

### `protected isKeyPressed(key: string): boolean`
Checks whether the given `KeyboardEvent.code` is currently pressed in the controls configured on the associated `ThreeWorld` (for example, `"KeyW"`). Returns `false` if the controller has not been initialized with a world or no controls are configured.

* **Parameters:** `key` is a keyboard code, not a character value. The configured controls must track that code for it to be reported.
* **Returns:** `boolean`

---

### `protected addMesh(mesh: THREE.Mesh): void`
Adds the mesh directly to the controller's scene.

* **Parameters:** `mesh` is the mesh to add.
* **Returns:** `void`

---

### `protected removeMesh(mesh: THREE.Mesh): void`
Removes the mesh directly from the controller's scene. It does not dispose the mesh geometry, material, textures, or child objects. Dispose owned resources separately, or use `IntegrateObject` to manage a mesh and optional physics body together.

* **Parameters:**
  * `mesh`: The mesh to remove.
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
        if (this.cube) {
            this.removeMesh(this.cube);
            this.cube.geometry.dispose();
            const materials = Array.isArray(this.cube.material)
                ? this.cube.material
                : [this.cube.material];
            materials.forEach((material) => material.dispose());
        }
    }
}
```
