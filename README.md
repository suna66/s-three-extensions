# s-three-extensions

Utilities for building Three.js scenes with a WebGPU renderer, DCC-style viewport camera controls, Rapier physics integration, and raycasting.

## Features

- **`ThreeWorld`**:
  - Manages a perspective camera, WebGPU renderer, frame timer, and keyed `SceneController` lifecycle.
  - Provides viewport resizing and keyed scene switching.
- **`SceneController`**:
  - Abstract base class for a scene's startup, per-frame update, physics integration (`initPhysics()`, `physicsDebug`, `enablePhysicsActiveEvent`), and cleanup logic.
  - Manages `SceneObject` instances, lights, per-scene camera controls (`controller`), and protected helpers for adding/removing meshes/lights, checking key state, and switching scenes.
- **`StudioControls`**:
  - Wraps `OrbitControls` with middle-button panning and fly-through controls.
  - Supports right-button look, left-Alt activation, WASDQE movement, and arrow-key rotation.
- **`BasicControls`**:
  - Lightweight keyboard-driven camera controller (`WASDQE` movement and arrow-key rotation) with OrbitControls mouse actions disabled.
- **`AbstractControls`**:
  - Base class for camera controls; owns keyboard state, pointer event callbacks (`mouseDownEvent`, `mouseMoveEvent`, `mouseUpEvent`), and the `OrbitControls` lifecycle.
- **`PhysicsWorld`**:
  - Wraps Rapier physics with Three.js object bindings, rigid bodies, colliders, sensors, debug renderer data, and collision events.
  - Steps the simulation and synchronizes dynamic body transforms back to their Three.js objects.
- **`SceneObject`**:
  - Groups a Three.js `Mesh` with an optional `PhysicsBodyHandle`, an optional `tag`, and an optional per-frame update callback (`addUpdateFunction()`).
  - Provides unified mesh and material/geometry disposal via `disposeMesh()`.
- **`Raycast`**:
  - Wraps `THREE.Raycaster` to convert client pointer coordinates relative to a DOM element and test intersections against Three.js objects.
- **`ExtensionUtils`**:
  - Provides `addResizeCallback()`, `removeResizeCallback()`, `disposeMesh()`, and `disposeLight()` utilities.

## Requirements

- Three.js `>=0.160.0` with `three/webgpu` and `OrbitControls` support.
- `@dimforge/rapier3d-compat` `>=0.21.0` to use `PhysicsWorld`.
- A browser with WebGPU support.

## Installation

The repository is currently marked private and does not define a built package entry point. To use the library, install Three.js and Rapier, then include this repository's `src/s-three-extensions` source in your project or workspace:

```bash
npm install https://github.com/suna66/s-three-extensions.git
```

The source barrel at `src/s-three-extensions/index.ts` exports:
- Classes: `ThreeWorld`, `SceneController`, `SceneObject`, `AbstractControls`, `StudioControls`, `BasicControls`, `PhysicsWorld`, `PhysicsBodyHandle`, `Raycast`
- Utilities: `addResizeCallback`, `removeResizeCallback`, `disposeMesh`, `disposeLight`
- Types: `ColliderMeta`, `BodyType`, `ColliderShapeSpec`, `ColliderOptions`, `RigidBodyOptions`, `CollisionEventPayload`

## Quick Start

This example switches between a basic scene and a physics scene with `Space`. `SceneObject` keeps each mesh together with its optional physics body, and each scene configures its camera controls via `this.controller`.

```typescript
import * as THREE from "three";
import {
  SceneController,
  SceneObject,
  StudioControls,
  ThreeWorld,
} from "./src/s-three-extensions";

class MainScene extends SceneController {
  private _cube: SceneObject | null = null;

  public start(): void {
    this.controller = new StudioControls(this.camera, this.domElement);
    this._cube = new SceneObject(() => {
      return new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshNormalMaterial(),
      );
    });
    this.addMesh(this._cube);
  }

  public update(_delta: number): void {
    if (this.isKeyPressed("Space")) this.loadScene("physics", false);
  }

  public override delete(): void {
    this.removeAllMesh();
    this._cube?.dispose(true);
  }
}

class PhysicsScene extends SceneController {
  private _sphere: SceneObject | null = null;
  private _ground: SceneObject | null = null;

  public async start(): Promise<void> {
    await this.initPhysics();
    this.controller = new StudioControls(this.camera, this.domElement);

    this._sphere = new SceneObject(() => {
      return new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshNormalMaterial(),
      );
    });
    this.addMesh(this._sphere);

    this._ground = new SceneObject(() => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -3;
      return mesh;
    });
    this.addMesh(this._ground);

    this._ground.setPhysicalBody((mesh) =>
      this.physicsWorld!.addBody(mesh, {
        type: "fixed",
        colliders: [{ shape: { type: "box", halfExtents: [5, 5, 0.1] } }],
      }),
    );
    this._sphere.setPhysicalBody((mesh) =>
      this.physicsWorld!.addBody(mesh, {
        type: "dynamic",
        colliders: [{ shape: { type: "autoSphere" }, restitution: 0.5 }],
      }),
    );
  }

  public update(_delta: number): void {
    if (this.isKeyPressed("Space")) this.loadScene("main", false);
  }

  public override delete(): void {
    this.removeAllMesh();
    this._sphere?.dispose(true);
    this._ground?.dispose(true);
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
const handleResize = () => world.resize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", handleResize);

world.addScene("main", new MainScene());
world.addScene("physics", new PhysicsScene());
await world.start("main");

// On teardown:
window.removeEventListener("resize", handleResize);
world.delete();
```

## Camera Controls (`StudioControls` & `BasicControls`)

### `StudioControls`

| Action                           | Input                                 | Description                                                        |
| :------------------------------- | :------------------------------------ | :----------------------------------------------------------------- |
| **Pan**                          | `Middle-Button Drag`                  | Pans the view.                                                     |
| **Activate fly-through**         | Hold `Left Alt` or right-button drag  | Enables fly-through movement while held.                           |
| **Look with mouse**              | Right-button drag                     | Directly rotates camera yaw and pitch.                             |
| **Orbit rotate**                 | `Left Alt` + left-button drag         | Rotates around the OrbitControls target.                           |
| **Look with keyboard**           | Arrow keys                            | Rotates the view while fly-through is active.                      |
| **Move**                         | `W` / `A` / `S` / `D` / `Q` / `E`     | Moves relative to the camera while fly-through is active.          |

### `BasicControls`

Provides `W` / `A` / `S` / `D` / `Q` / `E` movement and arrow-key rotation at all times without holding `Alt` or dragging, with OrbitControls mouse buttons disabled.

Keyboard input in both controllers is ignored when focus is in an `INPUT` or `TEXTAREA` element.
Assign controls to `SceneController.controller` so `SceneController.animate()` updates them each frame and `SceneController.isKeyPressed()` reads their key state.

## Documentation

See the detailed interface specifications:

- [ThreeWorld](./docs/threeworld_specification.md) | [日本語](./docs/ja/threeworld_specification.md)
- [SceneController](./docs/scenecontroller_specification.md) | [日本語](./docs/ja/scenecontroller_specification.md)
- [SceneObject](./docs/sceneobject_specification.md) | [日本語](./docs/ja/sceneobject_specification.md)
- [AbstractControls](./docs/abstractcontrols_specification.md) | [日本語](./docs/ja/abstractcontrols_specification.md)
- [StudioControls](./docs/studiocontrols_specification.md) | [日本語](./docs/ja/studiocontrols_specification.md)
- [BasicControls](./docs/basiccontrols_specification.md) | [日本語](./docs/ja/basiccontrols_specification.md)
- [PhysicsWorld](./docs/physicsworld_specification.md) | [日本語](./docs/ja/physicsworld_specification.md)
- [Raycast](./docs/raycast_specification.md) | [日本語](./docs/ja/raycast_specification.md)
- [ExtensionUtils](./docs/extensionutils_specification.md) | [日本語](./docs/ja/extensionutils_specification.md)

## License

MIT License
