# `BasicControls` Class Interface Specification

## 1. Overview
`BasicControls` is a lightweight keyboard-driven camera controller built on `AbstractControls`. Unlike `StudioControls`, it disables OrbitControls mouse-button actions by default and processes WASDQE movement and arrow-key rotation directly without requiring a modifier key.

* **Dependencies:** `three`, `AbstractControls`
* **Export Format:** `export default class BasicControls`, re-exported as `BasicControls` from `src/s-three-extensions/index.ts`

---

## 2. Control Modes and Keybindings

### Mouse Button Mapping (`defaultMode`)
All `OrbitControls.mouseButtons` slots (`LEFT`, `MIDDLE`, `RIGHT`) are set to `null`. Pointer events still invoke any `mouseDownEvent`, `mouseMoveEvent`, or `mouseUpEvent` callbacks configured on `AbstractControls`.

### Keyboard Controls
Keyboard controls are always active (no `Alt` key or mouse drag required). Input is ignored when focus is in an `INPUT` or `TEXTAREA` element (handled by `AbstractControls`).

* **Camera Rotation:**
  * `ArrowLeft` / `ArrowRight`: Rotates yaw at `rotateSpeed`.
  * `ArrowUp` / `ArrowDown`: Rotates pitch at `rotateSpeed` (clamped within $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$).
* **Camera Movement (Translation):**
  * `KeyW` / `KeyS`: Move forward / backward along the camera's world direction.
  * `KeyA` / `KeyD`: Strafe left / right perpendicular to the view direction.
  * `KeyQ` / `KeyE`: Move up / down along the camera's local Y-axis using `camera.translateY`.

---

## 3. Constructor

### `constructor(camera: THREE.Camera, dom: HTMLCanvasElement)`
Initializes `OrbitControls` via `AbstractControls`, sets all mouse buttons to `null`, sets `OrbitControls.target` 1 unit ahead of the camera, and registers pointer, keyboard, context-menu, and window blur event listeners.

* **Parameters:**
  * `camera` (`THREE.Camera`): The Three.js camera instance to control.
  * `dom` (`HTMLCanvasElement`): The canvas element to attach listeners to (typically `this.domElement`).

---

## 4. Properties (Setters)

| Property Name | Type | Access | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cameraSpeed` | `number` | Write-only | `5` | Movement speed for `WASDQE` navigation. |
| `rotateSpeed` | `number` | Write-only | `1.5` | Rotation speed for arrow-key look. |

---

## 5. Methods

### `setDamping(factor?: number): void`
Enables `OrbitControls` damping (`enableDamping = true`) and sets `dampingFactor`.

* **Parameters:**
  * `factor` (`number`, optional, default: `0.5`): The damping factor.
* **Returns:** `void`

### `disableDamping(): void`
Disables `OrbitControls` damping (`enableDamping = false`).

* **Returns:** `void`

### `update(delta: number): void`, `getKeyState(key: string): boolean`, `flash(): void`, `dispose(): void`
Inherited from `AbstractControls`. Assigning `BasicControls` to `SceneController.controller` causes `SceneController.animate()` to call `update(delta)` automatically each frame.

---

## 6. Usage Example

```typescript
import {
    BasicControls,
    SceneController,
    ThreeWorld,
} from "./src/s-three-extensions";

class BasicControlledScene extends SceneController {
    public start(): void {
        const controls = new BasicControls(this.camera, this.domElement);
        controls.cameraSpeed = 8;
        controls.rotateSpeed = 2.0;
        this.controller = controls;
    }

    public update(_delta: number): void {
        if (this.isKeyPressed("Space")) {
            // Handle Space key press
        }
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.addScene("basic", new BasicControlledScene());
await world.start("basic");
```
