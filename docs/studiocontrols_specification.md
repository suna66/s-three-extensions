# `StudioControls` Class Interface Specification

## 1. Overview
`StudioControls` is a camera controller class built on top of Three.js's `OrbitControls`, designed to provide viewport navigation similar to 3D DCC tools and game engines (such as Unreal Engine or Unity). In addition to standard panning, it supports fly-through (walk-through) navigation triggered by holding down the right mouse button or the left `Alt` key.

* **Dependencies:** `three`, `three/addons/controls/OrbitControls.js`
* **Export Format:** `export default class StudioControls`

---

## 2. Control Modes and Keybindings

### Mouse Button Mapping Modes (Internal)
The `OrbitControls.mouseButtons` configuration dynamically switches based on user input state.

| Mode Name | Trigger Condition | Left Click (`LEFT`) | Middle Click (`MIDDLE`) | Right Click (`RIGHT`) |
| :--- | :--- | :--- | :--- | :--- |
| `DefaultMode` | Default / Idle | None (`null`) | Pan (`THREE.MOUSE.PAN`) | None (`null`) |
| `FlayThroughMode` | Left `Alt` key (`AltLeft`) held OR right-button dragging | Orbit Rotate (`THREE.MOUSE.ROTATE`) | Pan (`THREE.MOUSE.PAN`) | None (`null`) |

### Fly-Through Mode Controls
The mode is active while the Left `Alt` key (`AltLeft`) is held or while the right mouse button is being dragged. Right-button dragging also captures the pointer and directly rotates the camera; holding Left `Alt` enables OrbitControls rotation with the left mouse button.

* **Camera Look (Rotation):**
  * **Right-Button Drag:** Rotates camera yaw (horizontal) and pitch (vertical) based on pointer movement delta. Mouse sensitivity is fixed at `0.003`; pitch is clamped within $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$.
  * **Left-Button Drag:** OrbitControls rotation is available while fly-through mode is active (for example, while Left `Alt` is held).
  * **Arrow Keys (`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`):** Rotates the camera at the speed defined by `rotateSpeed`.
* **Camera Movement (Translation):**
  * `KeyW` / `KeyS`: Move forward / backward along the camera's view direction.
  * `KeyA` / `KeyD`: Strafe left / right perpendicular to the view direction.
  * `KeyQ` / `KeyE`: Move up / down along the camera's local Y-axis using `camera.translateY`.

Keyboard input is ignored when the event target is an `INPUT` or `TEXTAREA` element. The fly-through movement and arrow-key rotation are processed only while fly-through mode is active. The mode is cleared on window blur.

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
  * Attaches pointer and context-menu listeners to `dom`, and keyboard, pointer-up, and blur listeners to `window`.
  * Disables the default browser context menu on the attached element.

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
Enables OrbitControls damping (inertia) and sets its damping factor. This applies to OrbitControls-managed movement, not the controller's direct keyboard or right-drag camera changes.

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
Calls `removeEventListener` for the registered pointer, context-menu, keyboard, and blur listeners. The `pointerdown` listener was registered with capture enabled but is removed without that option, so the browser does not remove that listener; repeated construction and disposal can leave this handler attached to `dom`.

* **Parameters:** None
* **Returns:** `void`

---

## 6. Usage Example

```typescript
import { SceneController } from "./SceneController";
import StudioControls from "./StudioControls";
import ThreeSpace from "./ThreeSpace";

class ControlledScene extends SceneController {
  private controls: StudioControls | null = null;

  public start(): void {
    this.controls = new StudioControls(this.camera, this.domElement);
    this.controls.cameraSpeed = 8;
    this.controls.rotateSpeed = 2.0;
    this.controls.setDamping(0.1);
  }

  public update(delta: number): void {
    this.controls?.update(delta);
  }

  public override delete(): void {
    this.controls?.dispose();
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const space = new ThreeSpace(canvas, window.innerWidth, window.innerHeight);

window.addEventListener("resize", () => {
  space.resize(window.innerWidth, window.innerHeight);
});

await space.start(new ControlledScene());

// On teardown:
// space.delete();
```