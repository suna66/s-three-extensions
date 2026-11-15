# `ThreeSpace` Class Interface Specification

## 1. Overview
`ThreeSpace` is a utility wrapper class designed to simplify 3D scene setup, rendering loops, and basic resource management using Three.js (`three/webgpu`). It centrally manages the initialization and lifecycle of the scene, perspective camera, WebGPU renderer, and timer.

* **Dependency:** `three/webgpu`
* **Export Format:** `export default class ThreeSpace`

---

## 2. Default Constants (Internal)
Default values applied during instance initialization.

| Constant Name | Value | Description |
| :--- | :--- | :--- |
| `DEFAULT_FOV` | `75` | Camera field of view (in degrees) |
| `DEFAULT_NEAR` | `0.1` | Camera near clipping plane |
| `DEFAULT_FAR` | `1000` | Camera far clipping plane |
| `DEFAULT_START_Z_POSITION` | `10` | Initial Z-axis position of the camera (`(0, 0, 10)`) |

---

## 3. Constructor

### `constructor(canvas: HTMLCanvasElement, width: number, height: number)`
Creates and initializes the core components of the 3D space (`Scene`, `PerspectiveCamera`, `WebGPURenderer`, and `Timer`).

* **Parameters:**
  * `canvas` (`HTMLCanvasElement`): The target HTML Canvas element for rendering.
  * `width` (`number`): Initial width of the viewport (in pixels).
  * `height` (`number`): Initial height of the viewport (in pixels).
* **Initial Behavior:**
  * Sets the camera position to `(0, 0, 10)`.
  * Instantiates `WebGPURenderer` with antialiasing enabled (`antialias: true`).
  * Instantiates `THREE.Timer` and connects it to `document` to handle page visibility changes accurately.

---

## 4. Properties (Getters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `camera` | `THREE.PerspectiveCamera` | Read-only | Returns the internal perspective camera instance. |
| `renderer` | `THREE.WebGPURenderer` | Read-only | Returns the internal WebGPU renderer instance. |
| `domElement` | `HTMLCanvasElement` | Read-only | Returns the HTML Canvas element used by the renderer (`renderer.domElement`). |

---

## 5. Methods

### `addScene(mesh: THREE.Mesh): void`
Adds the specified mesh to the scene.

* **Parameters:**
  * `mesh` (`THREE.Mesh`): The mesh object to add to the scene.
* **Returns:** `void`

---

### `removeMesh(mesh: THREE.Mesh, disposed?: boolean): void`
Removes the specified mesh from the scene, with an option to dispose of its GPU resources.

* **Parameters:**
  * `mesh` (`THREE.Mesh`): The mesh object to remove from the scene.
  * `disposed` (`boolean`, optional, default: `false`): If `true`, calls `.dispose()` on the mesh's `geometry` and `material` (or all materials if it is an array) to free memory.
* **Returns:** `void`

---

### `setCameraPosition(x: number, y: number, z: number): void`
Sets the world coordinates of the camera to the specified position.

* **Parameters:**
  * `x` (`number`): X-coordinate.
  * `y` (`number`): Y-coordinate.
  * `z` (`number`): Z-coordinate.
* **Returns:** `void`

---

### `addGridHelper(size: number, divisions: number): THREE.GridHelper`
Creates a grid helper on the XZ plane and adds it to the scene.

* **Parameters:**
  * `size` (`number`): The overall size of the grid.
  * `divisions` (`number`): The number of divisions across the grid.
* **Returns:**
  * `THREE.GridHelper`: The created and added grid helper instance.

---

### `resize(width: number, height: number): void`
Updates the camera's aspect ratio and the renderer's output size when the viewport dimensions change.

* **Parameters:**
  * `width` (`number`): The new width of the viewport (in pixels).
  * `height` (`number`): The new height of the viewport (in pixels).
* **Returns:** `void`

---

### `async start(animation?: (delta: number) => void): Promise<void>`
Asynchronously initializes the WebGPU renderer and starts the animation loop.

* **Parameters:**
  * `animation` (`(delta: number) => void`, optional): A callback function executed immediately before rendering each frame. The `delta` parameter receives the elapsed time (in seconds) since the previous frame.
* **Returns:** `Promise<void>`
* **Notes:** If `delete()` is called before `renderer.init()` resolves, the loop will safely abort without starting.

---

### `delete(): void`
Disposes of the instance by halting the animation loop, disconnecting the timer, and releasing timer resources.

* **Parameters:** None
* **Returns:** `void`
* **Notes:** Sets the internal disposal flag (`_disposed`) to `true`, stopping any subsequent frame updates and rendering.

---

## 6. Usage Example

```typescript
import * as THREE from "three/webgpu";
import ThreeSpace from "./ThreeSpace";

// 1. Initialization
const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const space = new ThreeSpace(canvas, window.innerWidth, window.innerHeight);

// 2. Add objects and helpers
space.addGridHelper(20, 20);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
space.addScene(cube);

// 3. Handle window resize
window.addEventListener("resize", () => {
    space.resize(window.innerWidth, window.innerHeight);
});

// 4. Start the animation loop
space.start((delta) => {
    cube.rotation.x += 1.0 * delta;
    cube.rotation.y += 1.0 * delta;
});

// 5. Cleanup (e.g., on component unmount)
// space.removeMesh(cube, true);
// space.delete();
```