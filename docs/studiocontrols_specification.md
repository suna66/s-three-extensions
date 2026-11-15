# `StudioControls` Class Interface Specification

## 1. Overview
`StudioControls` is a camera controller class built on top of Three.js's `OrbitControls`, designed to provide viewport navigation similar to 3D DCC tools and game engines (such as Unreal Engine or Unity). In addition to standard panning, it supports fly-through (walk-through) navigation triggered by holding down the right mouse button or the `Alt` key.

* **Dependencies:** `three`, `three/addons/controls/OrbitControls.js`
* **Export Format:** `export default class StudioControls`

---

## 2. Control Modes and Keybindings

### Mouse Button Mapping Modes (Internal)
The `OrbitControls.mouseButtons` configuration dynamically switches based on user input state.

| Mode Name | Trigger Condition | Left Click (`LEFT`) | Middle Click (`MIDDLE`) | Right Click (`RIGHT`) |
| :--- | :--- | :--- | :--- | :--- |
| `DefaultMode` | Default / Idle | None (`null`) | Pan (`THREE.MOUSE.PAN`) | None (`null`) |
| `FlayThroughMode` | Left `Alt` key held OR Right-click dragging | Orbit Rotate (`THREE.MOUSE.ROTATE`) | Pan (`THREE.MOUSE.PAN`) | None (`null`) |

### Fly-Through Mode Controls
Active while the Left `Alt` key (`AltLeft`) is pressed or while dragging with the right mouse button.

* **Camera Look (Rotation):**
  * **Right-Click Drag:** Rotates camera yaw (horizontal) and pitch (vertical) based on pointer movement delta. Pitch is clamped within $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$ to prevent gimbal flip.
  * **Arrow Keys (`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`):** Rotates the camera at the speed defined by `rotateSpeed`.
* **Camera Movement (Translation):**
  * `KeyW` / `KeyS`: Move forward / backward along the camera's view direction.
  * `KeyA` / `KeyD`: Strafe left / right perpendicular to the view direction.
  * `KeyQ` / `KeyE`: Move up / down along the camera's local Y-axis.

*(Note: Keyboard inputs are ignored while focus is inside an `INPUT` or `TEXTAREA` element.)*

---

## 3. Constructor

### `constructor(camera: THREE.Camera, dom: HTMLElement)`
Initializes `OrbitControls`, sets the initial orbit target, and registers pointer, keyboard, and window event listeners.

* **Parameters:**
  * `camera` (`THREE.Camera`): The Three.js camera instance to control.
  * `dom` (`HTMLElement`): The DOM element to attach pointer and contextmenu listeners to (typically `renderer.domElement`).
* **Initial Behavior:**
  * Sets the mouse button mapping to `DefaultMode`.
  * Sets `OrbitControls.target` to a point $1$ unit ahead of the camera along its current world direction (`getWorldDirection`).
  * Attaches event listeners to `dom` and `window`, and disables the default browser context menu on right-click.

---

## 4. Properties (Setters)

| Property Name | Type | Access | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cameraSpeed` | `number` | Write-only | `5` | Sets the movement speed during fly-through navigation (`WASDQE` keys). |
| `rotateSpeed` | `number` | Write-only | `1.5` | Sets the rotation speed when using the keyboard arrow keys. |

*(Note: Mouse right-drag look sensitivity `_mouseSensitivity` is fixed internally at `0.003`.)*

---

## 5. Methods

### `setDamping(factor?: number): void`
Enables camera damping (inertia) and sets the damping factor.

* **Parameters:**
  * `factor` (`number`, optional, default: `0.5`): The damping inertia factor (`OrbitControls.dampingFactor`). Smaller values result in smoother, longer deceleration.
* **Returns:** `void`

---

### `disableDamping(): void`
Disables camera damping (inertia).

* **Parameters:** None
* **Returns:** `void`

---

### `update(delta: number): void`
Updates the controller state. Must be called every frame within the animation loop.

* **Parameters:**
  * `delta` (`number`): Elapsed time (in seconds) since the previous frame, used to calculate frame-rate-independent movement and rotation.
* **Returns:** `void`

---

### `dispose(): void`
Removes all registered event listeners (`pointerdown`, `pointermove`, `contextmenu`, `pointerup`, `keydown`, `keyup`, `blur`) to clean up resources and prevent memory leaks.

* **Parameters:** None
* **Returns:** `void`

---

## 6. Usage Example

```typescript
import ThreeSpace from "./ThreeSpace";
import StudioControls from "./StudioControls";

// 1. Initialize ThreeSpace and StudioControls
const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const space = new ThreeSpace(canvas, window.innerWidth, window.innerHeight);
const controls = new StudioControls(space.camera, space.domElement);

// 2. Configure options (optional)
controls.cameraSpeed = 8;
controls.rotateSpeed = 2.0;
controls.setDamping(0.1);

// 3. Update inside the animation loop
space.start((delta) => {
    controls.update(delta);
});

// 4. Cleanup on unmount/disposal
// controls.dispose();
// space.delete();
```