# `AbstractControls` Class Interface Specification

## 1. Overview
`AbstractControls` is the exported abstract base class for camera controls. It owns a Three.js `OrbitControls` instance, tracks pressed keyboard codes, and provides shared update and cleanup methods for subclasses such as `StudioControls`.

* **Dependencies:** `three`, `three/addons/controls/OrbitControls.js`
* **Export Format:** Default export, re-exported as `AbstractControls` from `src/s-three-extensions/index.ts`

This class is not instantiated directly. A subclass must implement its keyboard update and pointer handlers, configure mouse-button modes, and call `setupEvents()` after its handlers are initialized.

---

## 2. Constructor

### `constructor(camera: THREE.Camera, dom: HTMLElement)`
Creates an `OrbitControls` instance, configures its initial mode, and sets its target one world-space unit in front of the camera.

* **Parameters:** `camera` is the camera to control; `dom` is the element used by `OrbitControls`.

---

## 3. Methods

### `getKeyState(key: string): boolean`
Returns whether the given `KeyboardEvent.code` is currently pressed. Keyboard input is ignored on `keydown` when the event target is an `INPUT` or `TEXTAREA`. The key state is cleared on window blur and by `flash()`.

### `flash(): void`
Clears tracked key state and resets the `OrbitControls` mouse-button mapping to the subclass's default mode.

### `update(delta: number): void`
Calls the subclass's `keyEvent(delta)` hook and updates the underlying `OrbitControls`. The application or owning `ThreeWorld` must call this each frame.

### `dispose(): void`
Removes the event listeners registered by `setupEvents()`. The `pointerdown` listener is registered with capture enabled but removed without the capture option, so that listener may remain attached. This method does not call `OrbitControls.dispose()`.

---

## 4. Subclass Hooks

| Hook | Description |
| :--- | :--- |
| `defaultMode(): MouseButtons` | Returns the default `OrbitControls.mouseButtons` mapping; used during setup and when `flash()` is called. |
| `setupControlOptions(): void` | Configures the initial mouse mapping and orbit target. |
| `setupEvents(): void` | Registers the subclass's pointer handlers and shared keyboard, blur, and context-menu handlers. |
| `keyEvent(delta: number): void` | Abstract hook for per-frame keyboard behavior. |
| `handleMouseDown(e: PointerEvent): void` | Abstract pointer-down handler. |
| `handleMouseMove(e: PointerEvent): void` | Abstract pointer-move handler. |
| `handleMouseUp(e: PointerEvent): void` | Abstract pointer-up handler. |

Subclasses can also set the protected `mouseButtons` property to change the underlying `OrbitControls.mouseButtons` mapping.

---

## 5. Usage

Use the concrete `StudioControls` implementation with `ThreeWorld.setControls()` to have the world update it each frame and make its key state available through `SceneController.isKeyPressed()`. See [StudioControls](./studiocontrols_specification.md) for a complete example.
