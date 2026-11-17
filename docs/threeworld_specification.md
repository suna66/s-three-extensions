# `ThreeWorld` Class Interface Specification

## 1. Overview
`ThreeWorld` manages a perspective camera, WebGPU renderer, frame timer, keyboard state, and the lifecycle of keyed `SceneController` instances. Each controller owns its own `THREE.Scene`.

* **Dependencies:** `three/webgpu`, `SceneController`
* **Export Format:** `export default class ThreeWorld`, re-exported as `ThreeWorld` from `src/s-three-extensions/index.ts`

---

## 2. Default Constants (Internal)

| Constant Name | Value | Description |
| :--- | :--- | :--- |
| `DEFAULT_FOV` | `75` | Camera field of view (degrees) |
| `DEFAULT_NEAR` | `0.1` | Camera near clipping plane |
| `DEFAULT_FAR` | `1000` | Camera far clipping plane |
| `DEFAULT_START_Z_POSITION` | `10` | Initial camera position is `(0, 0, 10)` |

---

## 3. Constructor

### `constructor(canvas: HTMLCanvasElement, width: number, height: number)`
Creates a `PerspectiveCamera`, a `WebGPURenderer`, and a `THREE.Timer`.

* **Parameters:** `canvas` is passed to the renderer; `width` and `height` set its initial size and the camera aspect ratio.
* **Initial Behavior:** Configures the camera with the defaults above, creates the renderer with antialiasing enabled, connects the timer to `document`, and registers window `keydown` and `keyup` listeners to track pressed `KeyboardEvent.code` values.

---

## 4. Properties (Getters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `camera` | `THREE.PerspectiveCamera` | Read-only | The internal perspective camera. |
| `renderer` | `THREE.WebGPURenderer` | Read-only | The internal WebGPU renderer. |
| `domElement` | `HTMLCanvasElement` | Read-only | The renderer's canvas (`renderer.domElement`). |

---

## 5. Methods

### `isKeyPressed(key: string): boolean`
Reports whether the specified keyboard code is currently pressed. Pass a `KeyboardEvent.code` value such as `"KeyW"` or `"ArrowUp"`.

### `addScene(key: string, scene: SceneController): void`
Initializes the controller with this world and registers it under `key`.

### `loadScene(key: string, isDelete: boolean = true): boolean`
Requests a transition to a registered controller. Returns `false` if `key` is not registered. The destination controller is resumed immediately; on the next animation frame it becomes active and the pressed-key set is cleared. The outgoing controller is deleted and removed from the registry when `isDelete` is `true`; otherwise it is suspended for later resumption.

### `setCameraPosition(x: number, y: number, z: number): void`
Sets the camera's world position.

### `resize(width: number, height: number): void`
Updates the camera aspect ratio and projection matrix, then updates the renderer size.

### `async start(startScene: string): Promise<void>`
Initializes the renderer, selects the registered controller for `startScene`, calls its `start()` method, and installs the render loop. If no controller is registered for the key, the method returns without starting the loop. Each frame updates the timer, applies any pending scene transition, calls the active controller's `update(delta)` with elapsed seconds since the previous frame, then renders its `scene` with the internal camera.

### `delete(): void`
Marks the instance as disposed, calls `delete()` on the active controller if present, removes the window keyboard listeners, and disconnects and disposes the timer. The renderer is not explicitly disposed by this method.

---

## 6. SceneController Relationship
`SceneController` owns the `THREE.Scene` and receives the `ThreeWorld` instance through `init(world)`, normally called by `addScene()`. It exposes the scene, camera, and canvas, and requires implementations of `start(): void` and `update(delta: number): void`. Controllers can request keyed transitions with the protected `loadScene()` method. Mesh helper methods such as `addMesh()` and `removeMesh()` belong to the controller.

---

## 7. Usage Example

```typescript
import * as THREE from "three/webgpu";
import ThreeWorld from "./ThreeWorld";
import { SceneController } from "./SceneController";

class SampleScene extends SceneController {
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

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.addScene("sample", new SampleScene());

window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight);
});

await world.start("sample");

// On teardown:
// world.delete();
```