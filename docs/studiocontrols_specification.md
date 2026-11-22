# `StudioControls` Class Interface Specification

## 1. Overview
`StudioControls` is a camera controller built on `AbstractControls` and Three.js's `OrbitControls`. It provides middle-button panning, orbit rotation with the left mouse button while fly-through mode is active, and direct camera look and movement while fly-through mode is active.

* **Dependencies:** `three`, `three/addons/controls/OrbitControls.js`, `AbstractControls`
* **Export Format:** `export default class StudioControls`, re-exported as `StudioControls` from `src/s-three-extensions/index.ts`

---

## 2. Control Modes and Keybindings

### Mouse Button Mapping Modes (Internal)
The `OrbitControls.mouseButtons` configuration dynamically switches based on user input state.

| Mode Name | Trigger Condition | Left Click (`LEFT`) | Middle Click (`MIDDLE`) | Right Click (`RIGHT`) |
| :--- | :--- | :--- | :--- | :--- |
| `DefaultMode` | Default / Idle | None (`null`) | Pan (`THREE.MOUSE.PAN`) | None (`null`) |
| `FlyThroughMode` | Left `Alt` key (`AltLeft`) held OR right-button dragging | Orbit Rotate (`THREE.MOUSE.ROTATE`) | Pan (`THREE.MOUSE.PAN`) | None (`null`) |

### Fly-Through Mode Controls
The mode is active while the Left `Alt` key (`AltLeft`) is held or while the right mouse button is being dragged. Right-button dragging captures the pointer and directly rotates the camera; holding Left `Alt` enables OrbitControls rotation with the left mouse button. In the default mode, left and right clicks do not trigger OrbitControls actions, while the middle button pans.

* **Camera Look (Rotation):**
  * **Right-Button Drag:** Rotates camera yaw (horizontal) and pitch (vertical) based on pointer movement delta. Mouse sensitivity is fixed at `0.003`; pitch is clamped within $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$.
  * **Left-Button Drag:** OrbitControls rotation is available while fly-through mode is active (for example, while Left `Alt` is held).
  * **Arrow Keys (`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`):** Rotates the camera at the speed defined by `rotateSpeed`.
* **Camera Movement (Translation):**
  * `KeyW` / `KeyS`: Move forward / backward along the camera's view direction.
  * `KeyA` / `KeyD`: Strafe left / right perpendicular to the view direction.
  * `KeyQ` / `KeyE`: Move up / down along the camera's local Y-axis using `camera.translateY`.

Keyboard input is ignored when the event target is an `INPUT` or `TEXTAREA` element. The fly-through movement and arrow-key rotation are processed only while fly-through mode is active. The mode is cleared on window blur.

Assigning a `StudioControls` instance to `SceneController.controller` causes `SceneController.animate()` to update it automatically each frame and supplies the key state used by `SceneController.isKeyPressed()`. `StudioControls` also inherits `getKeyState()`, `flush()`, `dispose()`, `update()`, and the `mouseDownEvent` / `mouseMoveEvent` / `mouseUpEvent` callback setters from `AbstractControls`, forwarding pointer events to those callbacks before/during its own pointer handling.

---

## 3. Constructor

### `constructor(camera: THREE.Camera, dom: HTMLCanvasElement)`
Initializes `OrbitControls`, sets the initial orbit target, and registers pointer, keyboard, and window event listeners.

* **Parameters:**
  * `camera` (`THREE.Camera`): The Three.js camera instance to control.
  * `dom` (`HTMLCanvasElement`): The canvas to attach pointer and contextmenu listeners to (typically `renderer.domElement`).
* **Initial Behavior:**
  * Sets the mouse button mapping to `DefaultMode`.
  * Sets `OrbitControls.target` to a point $1$ unit ahead of the camera along its current world direction (`getWorldDirection`).
  * Attaches pointer and context-menu listeners to `dom`, and keyboard, pointer-up, and blur listeners to `window` through `AbstractControls`.
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
Updates the controller state (inherited from `AbstractControls`). Must be called every frame within the animation loop (handled automatically when assigned to `SceneController.controller`).

* **Parameters:**
  * `delta` (`number`): Elapsed time (in seconds) since the previous frame, used to calculate frame-rate-independent movement and rotation.
* **Returns:** `void`

---

### `dispose(): void`
Inherited from `AbstractControls`. Removes registered event listeners (including the `{ capture: true }` `pointerdown` listener), disposes `OrbitControls`, and clears pointer callback references.

* **Parameters:** None
* **Returns:** `void`

---

## 6. Usage Example

```typescript
import {
    SceneController,
    StudioControls,
    ThreeWorld,
} from "./src/s-three-extensions";

class ControlledScene extends SceneController {
    public start(): void {
        const controls = new StudioControls(this.camera, this.domElement);
        controls.cameraSpeed = 8;
        controls.rotateSpeed = 2.0;
        controls.setDamping(0.1);
        this.controller = controls;
    }

    public update(_delta: number): void {
        if (this.isKeyPressed("Space")) {
            // Handle the pressed key.
        }
    }

    public override delete(): void {
        // Release scene-owned resources here.
        // Note: ThreeWorld disposes this.controller on scene deletion transitions;
        // call this.controller?.dispose() if tearing down via world.delete().
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);

window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight);
});

world.addScene("controlled", new ControlledScene());
await world.start("controlled");

// On teardown:
world.delete();
```
