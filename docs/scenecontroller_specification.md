# `SceneController` Class Interface Specification

## 1. Overview
`SceneController` is an abstract base class for a scene managed by `ThreeWorld`. It owns a `THREE.Scene`, manages `SceneObject` instances, lights, optional `AbstractControls`, and an optional `PhysicsWorld` (with debug rendering and collision event forwarding), and defines the scene lifecycle hooks.

* **Dependencies:** `three`, `ThreeWorld`, `SceneObject`, `PhysicsWorld`, `AbstractControls`, `PhysicsTypes`
* **Export Format:** `export abstract class SceneController` (named export)

---

## 2. Lifecycle

1. Construct a subclass; the base constructor creates an empty `THREE.Scene`.
2. `ThreeWorld.addScene(key, controller)` associates the controller with a key and calls `controller.init(world)`.
3. `ThreeWorld.start(key)` initializes the renderer, calls `start()` on the selected controller, and begins the render loop. (Inside `start()`, subclasses may call `await this.initPhysics()` and assign `this.controller`.)
4. A controller can request a transition with its protected `loadScene(key, isDelete)` method. The destination controller is resumed immediately (`resume()`); on the next animation frame the previous controller is either deleted (`delete()` + `dispose()`) and removed from the registry, or stopped and suspended (`suspend()`), then the destination becomes active.
5. For each rendered frame, `ThreeWorld` calls `animate(delta)` on the active controller before rendering its `scene`. `animate(delta)` steps physics, updates `controller`, updates all registered `SceneObject` instances, updates the physics debug wireframe if enabled, and calls `update(delta)`.
6. `ThreeWorld.delete()` calls `delete()` on the active controller.

The `camera` and `domElement` getters require `init(space)` to have run. Accessing them before initialization dereferences a `null` world and will fail.

---

## 3. Properties

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `scene` | `THREE.Scene` | Read-only | The scene owned by this controller. |
| `camera` | `THREE.Camera` | Read-only | The camera from the initialized `ThreeWorld`. |
| `domElement` | `HTMLCanvasElement` | Read-only | The renderer canvas from the initialized `ThreeWorld`. |
| `controller` | `AbstractControls \| null` | Read/Write | The camera controls instance for this scene. |
| `physicsWorld` | `PhysicsWorld \| null` | Read-only | The `PhysicsWorld` created by `initPhysics()`, or `null` if uninitialized. |
| `physicsDebug` | `boolean` | Read/Write | Enables or disables the Rapier physics debug wireframe (`THREE.LineSegments`) in `scene`. |
| `enablePhysicsActiveEvent` | `boolean` | Write-only | Subscribes or unsubscribes `physicsActiveEvent` to `physicsWorld.onCollision()` when `physicsWorld` is initialized. |
| `suspended` | `boolean` | Read-only (`@internal`) | Whether the controller is currently suspended. |

---

## 4. Methods

### `constructor()`
Creates an empty `THREE.Scene`. Subclasses may use the implicit base constructor or define their own constructor and call `super()`.

---

### `init(space: ThreeWorld): void`
Stores the `ThreeWorld` instance associated with this controller and resets internal state (`_suspended`, `_physicsWorld`, `_isDebug`, and `_sceneObjects`). Called by `ThreeWorld.addScene()`; call it before accessing `camera` or `domElement` when managing a controller outside that flow.

* **Parameters:** `space` is the owning `ThreeWorld` instance.
* **Returns:** `void`

---

### `async initPhysics(): Promise<void>`
Creates and initializes `_physicsWorld` via `PhysicsWorld.create()`. Call this in `start()` before creating physics bodies or enabling `enablePhysicsActiveEvent`.

* **Returns:** `Promise<void>`

---

### `abstract start(): void`
Called when the controller is first started or resumed from a non-suspended state. Implement this method to create and add the scene's initial objects, lights, controls, and physics world. On later resumes after suspension, `restart()` is called instead.

* **Returns:** `void`

---

### `abstract update(delta: number): void`
Called once per frame inside `animate(delta)` after physics stepping, camera controls update, `SceneObject` updates, and physics debug rendering.

* **Parameters:** `delta` is elapsed time in seconds since the previous frame (clamped to `0.1` by `ThreeWorld`).
* **Returns:** `void`

---

### `stop(): void` and `restart(): void`
Optional lifecycle hooks. `stop()` is called when this controller is switched away from with `isDelete = false`. `restart()` is called when a previously suspended controller is resumed. The base implementations do nothing.

---

### `delete(): void`
Optional cleanup hook called when the controller is deleted during a scene transition or when `ThreeWorld.delete()` is called while it is active. The base implementation does nothing; subclasses can override it to release their resources (for example, calling `removeAllSceneObjects()`, `removeAllLight()`, and disposing objects).

* **Returns:** `void`

---

### `collision(_event: CollisionEventPayload): void`
Optional callback invoked when `enablePhysicsActiveEvent` is `true` and a collision event is dispatched by `physicsWorld`. The base implementation does nothing; subclasses can override or assign it.

* **Parameters:** `_event` is the `CollisionEventPayload` from `PhysicsWorld`.
* **Returns:** `void`

---

### `animate(delta: number): void`
Per-frame execution pipeline called by `ThreeWorld`:
1. Calls `this._physicsWorld.step(delta)` if `_physicsWorld` exists.
2. Calls `this._controller.update(delta)` if `_controller` exists.
3. Calls `obj.update(delta)` for each `SceneObject` in `_sceneObjects` (returns early if `_sceneObjects` is `null`).
4. Updates the `position` and `color` attributes of the debug wireframe from `this._physicsWorld.debugRenderer` if `physicsDebug` and `_physicsWorld` are active.
5. Calls `this.update(delta)`.

---

### `suspend(): void`, `resume(): void`, `dispose(): void` (`@internal`)
Internal lifecycle methods called by `ThreeWorld`:
* `suspend()`: Calls `stop()` and marks `suspended` as `true`.
* `resume()`: Calls `restart()` if `suspended` is `true`, otherwise calls `start()`, then sets `suspended` to `false`.
* `dispose()`: Clears `_sceneObjects`, disposes `_physicsWorld` and `_controller` if present, unsubscribes `_physicsEventDispose`, and disables `physicsDebug`.

---

### `protected loadScene(key: string, isDelete: boolean = true): void`
Requests a transition to a controller registered under `key` through the associated `ThreeWorld`. If `isDelete` is `true`, the outgoing controller is deleted, disposed, and removed from the world's scene registry; otherwise it is suspended and can later be resumed. Does nothing if this controller has not been initialized with a world.

---

### `protected addScene(key: string, scene: SceneController): void`
Registers another `SceneController` under `key` on the associated `ThreeWorld`. Does nothing if this controller has not been initialized with a world.

---

### `protected isKeyPressed(key: string): boolean`
Checks whether the given `KeyboardEvent.code` is currently pressed in `this.controller` (for example, `"KeyW"` or `"Space"`). Returns `false` if `controller` is `null`.

---

### `protected addSceneObject(sceneObject: SceneObject): void`
Registers the `SceneObject` in `_sceneObjects` and, if `sceneObject.mesh` is non-null, adds `sceneObject.mesh` to `this.scene`.

---

### `protected removeSceneObject(sceneObject: SceneObject): void`
Removes `sceneObject.mesh` from `this.scene` (if non-null) and removes `sceneObject` from `_sceneObjects`. It does not dispose the mesh geometry, material, or textures; call `sceneObject.dispose(...)` separately when needed.

---

### `protected removeAllSceneObjects(): void`
Calls `removeSceneObject()` for every `SceneObject` registered in `_sceneObjects`.

---

### `protected addLight(light: THREE.Light): void`
Tracks `light` internally and adds it to `this.scene`.

---

### `protected removeLight(light: THREE.Light): void`
Removes `light` from the internal list and from `this.scene`.

---

### `protected removeAllLight(): void`
Calls `removeLight()` for all tracked lights.

---

## 5. Usage Example

```typescript
import * as THREE from "three";
import {
    SceneController,
    SceneObject,
    StudioControls,
} from "./src/s-three-extensions";

export class SampleScene extends SceneController {
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
```
