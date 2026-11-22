# `PhysicsWorld` Class Interface Specification

## 1. Overview
`PhysicsWorld` wraps `@dimforge/rapier3d-compat` and binds Rapier rigid bodies and colliders to Three.js `Object3D` instances. Call `step(delta)` from the application's update loop to advance the simulation, synchronize dynamic object transforms, and dispatch collision events.

* **Dependencies:** `three`, `@dimforge/rapier3d-compat`
* **Export Format:** Named exports `PhysicsWorld`, `PhysicsBodyHandle`, and `ColliderMeta` from `src/s-three-extensions/index.ts`

---

## 2. Initialization and Disposal

### `static async create(gravity?): Promise<PhysicsWorld>`
Initializes Rapier's WebAssembly module, then creates a physics world. The constructor is `private`, so always use this factory to create a `PhysicsWorld` instance.

* **Parameters:** `gravity` is an optional `{ x, y, z }` vector; it defaults to `{ x: 0, y: -9.81, z: 0 }`.
* **Returns:** An initialized `PhysicsWorld`.

### `disposed: boolean`
Read-only flag indicating whether `dispose()` has been called.

### `debugRenderer: { vertices: Float32Array; colors: Float32Array }`
Read-only getter returning the line-segment vertex positions and RGBA colors from Rapier's `world.debugRender()` for debug visualization.

### `dispose(): void`
Disposes the event queue and Rapier world, and clears object bindings, collider metadata, and collision listeners. Repeated calls have no effect. Dispose the world when it is no longer needed; do not use it afterward.

---

## 3. Rigid Bodies and Colliders

### `addBody(object: THREE.Object3D, options: RigidBodyOptions): PhysicsBodyHandle`
Creates a rigid body at the object's current world position and rotation, attaches the configured colliders, and returns a handle. If the object is already registered, its previous body is removed first. Objects with a parent are supported; simulation results are converted back to the object's parent-local position and rotation.

### `addSensor(object, shape, options?): PhysicsBodyHandle`
Creates a fixed rigid body with one sensor collider. `shape` is a `ColliderShapeSpec`; `options` may provide collider properties such as `tag`, `offset`, `friction`, or `restitution`, but not `shape` or `isSensor`.

### `attachCollider(object, rigidBody, options): RAPIER.Collider`
Creates a collider and associates its object and optional tag with collision events. This lower-level method expects a rigid body belonging to this world; normally add colliders through `PhysicsBodyHandle.addCollider()` instead.

### `replaceColliders(object, rigidBody, specs): void`
Removes the rigid body's current colliders and creates replacements from `specs`. Prefer `PhysicsBodyHandle.rebuildColliders()` after adding collider specs through the handle, so the handle can retain the specs for future rebuilds.

### `removeObject(object: THREE.Object3D): void`
Removes the registered body's colliders and rigid body. Does nothing if the object is not registered. This does not remove the object from the Three.js scene or dispose its geometry/materials.

### `getPhysicsBodyHandle(obj: THREE.Object3D): PhysicsBodyHandle | null`
Returns the `PhysicsBodyHandle` registered for `obj`, or `null` if no body is registered for it.

---

## 4. Simulation and Collision Events

### `step(dt: number): void`
Sets the Rapier timestep to `dt`, steps the simulation, copies dynamic rigid-body position and rotation back to their bound Three.js objects, then dispatches queued collision events. Call it once per update with elapsed seconds. Kinematic bodies are not copied from Rapier to their objects by this method; use `PhysicsBodyHandle.syncFromObject()` to submit object transforms to a kinematic body.

### `onCollision(listener): () => void`
Registers a listener for collision start and stop events and returns an unsubscribe function. The callback receives a `CollisionEventPayload`; `started` is `true` when the intersection begins and `false` when it ends. `selfObject` / `otherObject` and their optional tags identify the collider pair for the event.

---

## 5. `PhysicsBodyHandle`
Returned by `addBody()` and `addSensor()`. It provides access to the bound object and Rapier body, and retains the collider specs supplied at creation or added through the handle.

| Property | Type | Description |
| :--- | :--- | :--- |
| `object` | `THREE.Object3D` | The Three.js object bound to the body. |
| `rigidBody` | `RAPIER.RigidBody` | The underlying Rapier rigid body. |

### `addCollider(options: ColliderOptions): RAPIER.Collider`
Adds a collider to the body and retains its options for later rebuilding.

### `replaceColliders(colliders: ColliderOptions[]): void`
Replaces the body's colliders with `colliders` via `PhysicsWorld.replaceColliders()` and updates the retained collider specs to a shallow copy of `colliders`.

### `rebuildColliders(): void`
Replaces the body's colliders using the options retained by this handle.

### `copyColliders(): ColliderOptions[]`
Returns a shallow copy of the collider options retained by this handle.

### `syncFromObject(): void`
Copies the object's current world position and rotation to the rigid body. For kinematic bodies, sets the next kinematic translation and rotation; for other body types, directly sets translation and rotation.

### `dispose(): void`
Removes the bound rigid body and its colliders from the associated `PhysicsWorld`.

---

## 6. Public Types

The following types are exported from the package barrel:

* `BodyType`: `"dynamic"`, `"fixed"`, `"kinematicPosition"`, or `"kinematicVelocity"`.
* `ColliderShapeSpec`: `autoBox`, `autoSphere`, `box`, `sphere`, `capsule`, `convexHull`, or `trimesh`.
* `ColliderOptions`: collider shape plus optional sensor flag (`isSensor`), collision event flag (`activeEvent`, which enables `RAPIER.ActiveEvents.COLLISION_EVENTS` when `true`), offset, world-scale behavior, tag, friction, restitution, and density.
* `RigidBodyOptions`: body type, initial collider list, optional rotation locks, and linear/angular damping.
* `CollisionEventPayload`: the two collider objects, optional tags, and whether the collision started or ended.
* `ColliderMeta`: collider object, optional tag, and sensor flag. Used internally to associate colliders with collision callbacks.

Shape parameters:

| Shape | Parameters | Behavior |
| :--- | :--- | :--- |
| `autoBox` | None | Builds a box collider from the bounds of mesh vertices under the object, including descendants. |
| `autoSphere` | None | Builds a sphere collider from the bounding sphere of the axis-aligned bounds of those vertices. |
| `box` | `halfExtents: [x, y, z]` | Builds a cuboid from the specified half-extents. |
| `sphere` | `radius` | Builds a ball collider. |
| `capsule` | `halfHeight`, `radius` | Builds a capsule aligned to the object's local Y axis. |
| `convexHull` | None | Computes a convex hull from mesh vertices under the object; throws if Rapier cannot construct one. |
| `trimesh` | None | Builds a triangle mesh from mesh vertices and indices under the object. |

For explicit box, sphere, and capsule dimensions, `applyWorldScale` defaults to `true`. `offset` defaults to `[0, 0, 0]`; automatic shapes also apply the computed center offset. Collider material properties and tags are optional.

---

## 7. Usage Example

```typescript
import * as THREE from "three";
import { PhysicsWorld } from "./src/s-three-extensions";

const physics = await PhysicsWorld.create();
const geometry = new THREE.SphereGeometry(1);
const material = new THREE.MeshNormalMaterial();
const sphere = new THREE.Mesh(geometry, material);

const body = physics.addBody(sphere, {
    type: "dynamic",
    colliders: [{ shape: { type: "autoSphere" }, restitution: 0.5 }],
});

const unsubscribe = physics.onCollision((event) => {
    if (event.started) {
        console.log("Collision started", event.selfObject, event.otherObject);
    }
});

function update(delta: number): void {
    physics.step(delta);
}

// On teardown:
unsubscribe();
body.dispose();
physics.dispose();
geometry.dispose();
material.dispose();
```