# `IntegrateObject` Class Interface Specification

## 1. Overview
`IntegrateObject` groups a Three.js `Mesh` with an optional `PhysicsBodyHandle`. It provides a shared lifecycle for these references, but it does not add the mesh to a scene or automatically create a physics body.

* **Dependencies:** `three`, `PhysicsBodyHandle`
* **Export Format:** `export default class IntegrateObject`, re-exported as `IntegrateObject` from `src/s-three-extensions/index.ts`

---

## 2. Constructor

### `constructor(mesh: (() => THREE.Mesh) | THREE.Mesh | null = null)`
Creates an `IntegrateObject` with an optional mesh. If a factory function is provided, it is called immediately and its returned mesh is stored.

---

## 3. Properties (Getters)

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `mesh` | `THREE.Mesh \| null` | Read-only | The managed mesh, or `null` if none is set or after disposal. |
| `physicsBodyHandle` | `PhysicsBodyHandle \| null` | Read-only | The managed physics body handle, or `null` if none is set or after disposal. |

---

## 4. Methods

### `setMesh(func: () => THREE.Mesh): void`
Calls `func` immediately and stores the returned mesh. It does not add the mesh to a Three.js scene and does not dispose any previously stored mesh or physics body. If replacing a mesh that already has a body handle, the handle remains associated with its original mesh.

### `setPhysicalBody(func: (mesh: THREE.Mesh) => PhysicsBodyHandle): void`
Passes the stored mesh to `func` and stores the returned handle. Throws an `Error` if no mesh has been set. The callback can create a body in a `PhysicsWorld`, for example with `physicsWorld.addBody(mesh, options)`. Calling this method again replaces the stored handle without disposing the previous one; dispose the previous handle separately if needed.

### `dispose(isDelete: boolean = false): void`
Disposes the stored physics body handle, if present, and clears both stored references. When `isDelete` is `true`, also disposes the mesh geometry and material (or each material when the material is an array). It does not remove the mesh from its parent or scene. Remove the mesh from the scene separately before disposing it when needed.

---

## 5. Usage Example

```typescript
import * as THREE from "three";
import { IntegrateObject, PhysicsWorld } from "./src/s-three-extensions";

const physicsWorld = await PhysicsWorld.create();
const object = new IntegrateObject(() => {
    const geometry = new THREE.SphereGeometry(1);
    const material = new THREE.MeshNormalMaterial();
    return new THREE.Mesh(geometry, material);
});

scene.add(object.mesh!);
object.setPhysicalBody((mesh) =>
    physicsWorld.addBody(mesh, {
        type: "dynamic",
        colliders: [{ shape: { type: "autoSphere" } }],
    }),
);

function update(delta: number): void {
    physicsWorld.step(delta);
}

// On teardown:
scene.remove(object.mesh!);
object.dispose(true);
physicsWorld.dispose();
```