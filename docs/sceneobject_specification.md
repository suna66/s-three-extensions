# `SceneObject` Class Interface Specification

## 1. Overview
`SceneObject` groups a Three.js `Mesh` with an optional `PhysicsBodyHandle`, an optional `tag`, and an optional per-frame update callback. When registered with `SceneController.addMesh()`, its `update(delta)` method is called automatically each frame.

* **Dependencies:** `three`, `PhysicsBodyHandle`, `ExtensionUtils` (`disposeMesh`)
* **Export Format:** `export default class SceneObject`, re-exported as `SceneObject` from `src/s-three-extensions/index.ts`

---

## 2. Constructor

### `constructor(mesh: (() => THREE.Mesh) | THREE.Mesh | null = null)`
Creates a `SceneObject` with an optional mesh. If a factory function is provided, it is called immediately and its returned mesh is stored.

---

## 3. Properties

| Property Name | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `tag` | `string \| null` | Read/Write | An optional string tag identifying this object (`null` by default; setter accepts `string`). |
| `mesh` | `THREE.Mesh \| null` | Read-only | The managed mesh, or `null` if none is set or after disposal. |
| `physicsBodyHandle` | `PhysicsBodyHandle \| null` | Read-only | The managed physics body handle, or `null` if none is set or after disposal. |

---

## 4. Methods

### `setMesh(func: () => THREE.Mesh): void`
Calls `func` immediately and stores the returned mesh. It does not add the mesh to a Three.js scene and does not dispose any previously stored mesh or physics body.

### `setPhysicalBody(func: (mesh: THREE.Mesh) => PhysicsBodyHandle): void`
Passes the stored mesh to `func` and stores the returned handle. Throws an `Error` if no mesh has been set (`"A mesh must be added before adding a physical body."`). Calling this method again replaces the stored handle without disposing the previous one; dispose the previous handle separately if needed.

### `setPhysicsMesh(meshFunc: () => THREE.Mesh, physicsFunc: (mesh: THREE.Mesh) => PhysicsBodyHandle): void`
Convenience method that calls `meshFunc()` to create and store the mesh, then immediately passes that mesh to `physicsFunc(mesh)` and stores the returned `PhysicsBodyHandle`.

### `addUpdateFunction(func: (delta: number, mesh: THREE.Mesh, bodyHandle: PhysicsBodyHandle | null) => void): void`
Registers a per-frame update callback for this object. Does nothing if no mesh is currently set.

### `update(delta: number): void` (`@local`)
Invokes the registered update callback with `(delta, mesh, physicsBodyHandle)` if both an update function and a mesh are present. Normally called automatically by `SceneController.animate()`.

### `dispose(deleteMeshMaterial: boolean = false): void`
Calls `disposeMesh(this._mesh, deleteMeshMaterial)` (which removes the mesh from its parent, calls `mesh.dispose()` if available, and disposes geometry and material(s) when `deleteMeshMaterial` is `true`), then clears both `_mesh` and `_physicsBodyHandle` references to `null`. Note that this method does not call `physicsBodyHandle.dispose()`; dispose the `PhysicsBodyHandle` or `PhysicsWorld` separately when needed.

---

## 5. Usage Example

```typescript
import * as THREE from "three";
import {
    SceneController,
    SceneObject,
    StudioControls,
} from "./src/s-three-extensions";

export class PhysicsDemoScene extends SceneController {
    private sphere: SceneObject | null = null;

    public async start(): Promise<void> {
        await this.initPhysics();
        this.controller = new StudioControls(this.camera, this.domElement);

        this.sphere = new SceneObject();
        this.sphere.setPhysicsMesh(
            () => {
                const geometry = new THREE.SphereGeometry(1, 32, 32);
                const material = new THREE.MeshNormalMaterial();
                return new THREE.Mesh(geometry, material);
            },
            (mesh) =>
                this.physicsWorld!.addBody(mesh, {
                    type: "dynamic",
                    colliders: [{ shape: { type: "autoSphere" }, restitution: 0.5 }],
                }),
        );

        this.sphere.addUpdateFunction((_delta, mesh) => {
            // Per-frame custom logic on the mesh or bodyHandle
            if (mesh.position.y < -10) {
                mesh.position.set(0, 5, 0);
            }
        });

        this.addMesh(this.sphere);
    }

    public update(_delta: number): void {}

    public override delete(): void {
        this.removeAllMesh();
        this.sphere?.dispose(true);
    }
}
```
