# `ThreeWorld` Class Interface Specification

## 1. Overview
`ThreeWorld` manages a perspective camera, WebGPU renderer, frame timer, and the lifecycle of keyed `SceneController` instances. Each controller owns its own `THREE.Scene`, camera controls, and optional `PhysicsWorld`.

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
* **Initial Behavior:** Configures the camera with the defaults above, creates the renderer with antialiasing enabled, and connects the timer to `document`.

---

## 4. Properties (Getters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `camera` | `THREE.PerspectiveCamera` | Read-only | The internal perspective camera. |
| `renderer` | `THREE.WebGPURenderer` | Read-only | The internal WebGPU renderer. |
| `domElement` | `HTMLCanvasElement` | Read-only | The renderer's canvas (`renderer.domElement`). |

---

## 5. Methods

### `addScene(key: string, scene: SceneController): void`
Initializes the controller with this world (`scene.init(this)`) and registers it under `key`.

### `loadScene(key: string, isDelete: boolean = true): boolean`
Requests a transition to a registered controller. Returns `false` if `key` is not registered. The destination controller is resumed immediately (`resume()`); on the next animation frame it becomes active. The outgoing controller is deleted (`delete()`), disposed (`dispose()`), and removed from the registry when `isDelete` is `true`; otherwise it is suspended (`suspend()`) for later resumption.

### `setCameraPosition(x: number, y: number, z: number): void`
Sets the camera's world position.

### `resize(width: number, height: number): void`
Updates the camera aspect ratio and projection matrix, then updates the renderer size.

### `async start(startScene: string): Promise<void>`
Initializes the renderer, selects the registered controller for `startScene`, calls its `start()` method, and installs the render loop. If no controller is registered for the key, the method returns without starting the loop. Each frame updates the timer, clamps elapsed `delta` to at most `0.1` seconds, applies any pending scene transition, calls `animate(delta)` on the active controller, then renders its `scene` with the internal camera.

### `delete(): void`
Marks the instance as disposed, stops the animation loop (`setAnimationLoop(null)`), calls `delete()` and `dispose()` on all remaining registered/active controllers, clears the scene stack, disconnects and disposes the timer, and disposes the renderer.

---

## 6. SceneController Relationship
`SceneController` owns the `THREE.Scene` and receives the `ThreeWorld` instance through `init(space)`, normally called by `addScene()`. It exposes the scene, camera, and canvas, and requires implementations of `start(): void` and `update(delta: number): void`. Controllers manage their own `controller` (`AbstractControls`) and optional `physicsWorld` (`PhysicsWorld`), and can request keyed transitions or register new scenes with the protected `loadScene()` and `addScene()` methods.

---

## 7. Usage Example

```typescript
import * as THREE from "three";
import {
    SceneController,
    SceneObject,
    StudioControls,
    ThreeWorld,
} from "./src/s-three-extensions";

class SampleScene extends SceneController {
    private cube: SceneObject | null = null;

    public start(): void {
        this.controller = new StudioControls(this.camera, this.domElement);
        this.cube = new SceneObject(() => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            return new THREE.Mesh(geometry, material);
        });
        this.addSceneObject(this.cube);
    }

    public update(delta: number): void {
        if (!this.cube?.mesh) return;
        this.cube.mesh.rotation.x += delta;
        this.cube.mesh.rotation.y += delta;
    }

    public override delete(): void {
        this.removeAllSceneObjects();
        this.cube?.dispose(true);
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.addScene("sample", new SampleScene());

const handleResize = () => world.resize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", handleResize);

await world.start("sample");

// On teardown:
window.removeEventListener("resize", handleResize);
world.delete();
```
