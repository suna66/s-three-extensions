# `ThreeSpace` Class Interface Specification

## 1. Overview
`ThreeSpace` manages a perspective camera, WebGPU renderer, frame timer, and the lifecycle of a `SceneController`. The scene itself is owned by the controller rather than by `ThreeSpace`.

* **Dependencies:** `three/webgpu`, `SceneController`
* **Export Format:** `export default class ThreeSpace`

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
Creates a `PerspectiveCamera`, a `WebGPURenderer`, and a `THREE.Timer`. It does not create a scene; a `SceneController` supplies the scene when `start()` is called.

* **Parameters:**
  * `canvas` (`HTMLCanvasElement`): Canvas passed to the renderer.
  * `width` (`number`): Initial renderer width in pixels and input to the camera aspect ratio.
  * `height` (`number`): Initial renderer height in pixels and input to the camera aspect ratio.
* **Initial Behavior:**
  * Configures the camera with the defaults above and places it at `(0, 0, 10)`.
  * Creates `WebGPURenderer` with antialiasing enabled and sets its initial size.
  * Connects the timer to `document`.
  * Registers window `keydown` and `keyup` listeners to track pressed `KeyboardEvent.code` values.

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
Reports whether the specified keyboard code is currently in the pressed-key set. Pass a `KeyboardEvent.code` value such as `"KeyW"` or `"ArrowUp"`.

* **Returns:** `true` when the key is pressed; otherwise `false`.

---

### `setSwitchScene(nextScene: SceneController): void`
Schedules a controller to replace the current scene. The incoming controller is initialized with this `ThreeSpace` and its `start()` method is called immediately. On the next animation frame, the current controller is deleted, the incoming controller becomes active, and the pressed-key set is cleared. The new controller then receives frame updates and rendering.

* **Parameters:** `nextScene` is the controller to activate.
* **Returns:** `void`

### `setCameraPosition(x: number, y: number, z: number): void`
Sets the camera's world position.

* **Parameters:** `x`, `y`, and `z` are the world coordinates.
* **Returns:** `void`

---

### `resize(width: number, height: number): void`
Updates the camera aspect ratio and projection matrix, then updates the renderer size.

* **Parameters:** `width` and `height` are the new viewport dimensions in pixels.
* **Returns:** `void`

---

### `async start(scene: SceneController): Promise<void>`
Initializes the renderer, initializes and starts the supplied scene controller, then installs the render loop.

* **Parameters:**
  * `scene` (`SceneController`): Controller that owns the `THREE.Scene` and implements `start()` and `update(delta)`.
* **Returns:** `Promise<void>`
* **Frame behavior:** Each frame updates the timer, applies any pending scene switch, calls the active controller's `update(delta)` with elapsed seconds since the previous frame, then renders its `scene` with the internal camera.
* **Notes:** If `delete()` has been called before renderer initialization resolves, `start()` returns without initializing the scene or starting the loop.

---

### `delete(): void`
Marks the instance as disposed, calls `delete()` on the active scene controller if present, removes the window keyboard listeners, and disconnects and disposes the timer. The installed animation-loop callback checks the disposal flag and stops updating and rendering. The renderer is not explicitly disposed by this method.

* **Returns:** `void`

---

## 6. SceneController Relationship
`SceneController` owns the `THREE.Scene` and receives the `ThreeSpace` instance through `init(space)`. It exposes the scene, camera, and canvas, and requires implementations of `start(): void` and `update(delta: number): void`. Mesh helper methods such as `addMesh()` and `removeMesh()` belong to the controller and are protected; they are not public methods of `ThreeSpace`.

---

## 7. Usage Example

```typescript
import * as THREE from "three/webgpu";
import ThreeSpace from "./ThreeSpace";
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
        if (this.cube) this.removeMesh(this.cube, true);
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const space = new ThreeSpace(canvas, window.innerWidth, window.innerHeight);
const scene = new SampleScene();

window.addEventListener("resize", () => {
    space.resize(window.innerWidth, window.innerHeight);
});

await space.start(scene);

// On teardown:
// space.delete();
```