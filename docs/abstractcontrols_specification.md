# `AbstractControls` Class Interface Specification

## 1. Overview
`AbstractControls` is the exported abstract base class for camera controls. It owns a Three.js `OrbitControls` instance, tracks pressed keyboard codes, forwards optional pointer event callbacks, and provides shared update and cleanup methods for subclasses such as `BasicControls` and `StudioControls`.

* **Dependencies:** `three`, `three/addons/controls/OrbitControls.js`
* **Export Format:** Default export (`export default abstract class AbstractControls`), re-exported as `AbstractControls` from `src/s-three-extensions/index.ts`. Also exports `MouseButtons` from `AbstractControls.ts`.

This class is not instantiated directly. A subclass must implement `keyEvent(delta: number)` and call `setupEvents()` after initializing its handlers.

---

## 2. Exported Types

### `MouseButtons`
```typescript
export type MouseButtons = {
    LEFT: THREE.MOUSE | null;
    MIDDLE: THREE.MOUSE | null;
    RIGHT: THREE.MOUSE | null;
};
```

---

## 3. Constructor

### `constructor(camera: THREE.Camera, dom: HTMLElement)`
Creates an `OrbitControls` instance, configures its initial mode via `setupControlOptions()`, and sets its target one world-space unit in front of the camera.

* **Parameters:** `camera` is the camera to control; `dom` is the element used by `OrbitControls`.

---

## 4. Properties (Setters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `mouseDownEvent` | `(e: PointerEvent) => void` | Write-only | Optional callback invoked on `pointerdown` on `dom`. |
| `mouseMoveEvent` | `(e: PointerEvent) => void` | Write-only | Optional callback invoked on `pointermove` on `dom`. |
| `mouseUpEvent` | `(e: PointerEvent) => void` | Write-only | Optional callback invoked on `pointerup` on `window`. |

---

## 5. Methods

### `getKeyState(key: string): boolean`
Returns whether the given `KeyboardEvent.code` is currently pressed. Keyboard input is ignored on `keydown` when the event target is an `INPUT` or `TEXTAREA`. `Alt` key default browser behavior is prevented on `keydown` and `keyup`. The key state is cleared on window blur and by `flash()`.

### `flash(): void`
Clears tracked key state and resets the `OrbitControls` mouse-button mapping to the subclass's `defaultMode()`.

### `update(delta: number): void`
Calls the subclass's `keyEvent(delta)` hook and updates the underlying `OrbitControls`. The application or owning `SceneController` must call this each frame.

### `dispose(): void`
Removes the event listeners registered by `setupEvents()` and clears `mouseDownEvent`, `mouseMoveEvent`, and `mouseUpEvent` references to `null`. Note that the `pointerdown` listener is registered with `{ capture: true }` but removed without the capture option, so that listener may remain attached. This method does not call `OrbitControls.dispose()`.

---

## 6. Subclass Hooks

| Hook | Description |
| :--- | :--- |
| `defaultMode(): MouseButtons` | Returns the default `OrbitControls.mouseButtons` mapping; used during setup and when `flash()` is called. |
| `setupControlOptions(): void` | Configures the initial mouse mapping and orbit target. |
| `setupEvents(): void` | Registers pointer (`pointerdown` capture, `pointermove`, `contextmenu` on `dom`; `pointerup` on `window`), keyboard, and `blur` handlers. |
| `keyEvent(delta: number): void` | Abstract hook for per-frame keyboard behavior. |
| `handleMouseDown(e: PointerEvent): void` | Pointer-down handler; invokes `mouseDownEvent` if set (can be overridden by subclasses). |
| `handleMouseMove(e: PointerEvent): void` | Pointer-move handler; invokes `mouseMoveEvent` if set (can be overridden by subclasses). |
| `handleMouseUp(e: PointerEvent): void` | Pointer-up handler; invokes `mouseUpEvent` if set (can be overridden by subclasses). |

Subclasses can also set the protected `mouseButtons` property to change the underlying `OrbitControls.mouseButtons` mapping.

---

## 7. Usage

Assign a concrete implementation (`StudioControls` or `BasicControls`) to `SceneController.controller` so the scene updates it each frame and `SceneController.isKeyPressed()` can read its key state. See [StudioControls](./studiocontrols_specification.md) and [BasicControls](./basiccontrols_specification.md) for complete examples.
