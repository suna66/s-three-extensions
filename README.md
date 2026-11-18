# s-three-extensions

Utilities for building Three.js scenes with a WebGPU renderer and DCC-style viewport camera controls.

## Features

- **`ThreeWorld`**:
  - Manages a perspective camera, WebGPU renderer, frame timer, and scene-controller lifecycle.
  - Provides viewport resizing, configurable camera controls, and keyed scene switching.
- **`StudioControls`**:
  - Wraps `OrbitControls` with middle-button panning and fly-through controls.
  - Supports right-button look, left-Alt activation, WASDQE movement, and arrow-key rotation.
- **`AbstractControls`**:
  - Base class for camera controls; owns keyboard state and the `OrbitControls` lifecycle.
- **`SceneController`**:
  - Abstract base class for a scene's startup, per-frame update, and cleanup logic.
  - Provides protected helpers for adding/removing meshes, checking control key state, and requesting scene switches.
- **`PhysicsWorld`**:
  - Wraps Rapier physics with Three.js object bindings, rigid bodies, colliders, sensors, and collision events.
  - Steps the simulation and synchronizes dynamic body transforms back to their Three.js objects.
- **`IntegrateObject`**:
  - Groups a Three.js mesh with an optional `PhysicsBodyHandle`.
  - Provides a single place to release the physics body and optionally dispose mesh geometry and materials.

## Requirements

- Three.js `>=0.160.0` with `three/webgpu` and `OrbitControls` support.
- `@dimforge/rapier3d-compat` `>=0.21.0` to use `PhysicsWorld`.
- A browser with WebGPU support.

## Installation

The repository is currently marked private and does not define a built package entry point. To use the library, install Three.js and Rapier, then include this repository's `src/s-three-extensions` source in your project or workspace:

```bash
npm install  https://github.com/suna66/s-three-extensions.git
```

The source barrel at `src/s-three-extensions/index.ts` exports `ThreeWorld`, `AbstractControls`, `StudioControls`, `SceneController`, `PhysicsWorld`, `IntegrateObject`, and related helpers and types.

## Quick Start

This example switches between a basic scene and a physics scene with `Space`. `IntegrateObject` keeps each mesh together with its optional physics body. `StudioControls` is created from the initialized controller's camera and canvas.

```typescript
import * as THREE from "three";
import {
  IntegrateObject,
  PhysicsWorld,
  SceneController,
  StudioControls,
  ThreeWorld,
} from "./src/s-three-extensions";

class MainScene extends SceneController {
  private _cube: IntegrateObject | null = null;

  public start(): void {
    this._cube = new IntegrateObject(() => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshNormalMaterial(),
      );
      this.addMesh(mesh);
      return mesh;
    });
  }

  public update(_delta: number): void {
    if (this.isKeyPressed("Space")) this.loadScene("physics", false);
  }

  public override delete(): void {
    if (this._cube?.mesh) this.removeMesh(this._cube.mesh);
    this._cube?.dispose(true);
  }
}

class PhysicsScene extends SceneController {
  private _physicsWorld: PhysicsWorld | null = null;
  private _sphere: IntegrateObject | null = null;
  private _ground: IntegrateObject | null = null;

  public async start(): Promise<void> {
    this._physicsWorld = await PhysicsWorld.create();

    this._sphere = new IntegrateObject(() => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshNormalMaterial(),
      );
      this.addMesh(mesh);
      return mesh;
    });

    this._ground = new IntegrateObject(() => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -3;
      this.addMesh(mesh);
      return mesh;
    });

    this._ground.setPhysicalBody((mesh) =>
      this._physicsWorld!.addBody(mesh, {
        type: "fixed",
        colliders: [{ shape: { type: "box", halfExtents: [10, 10, 0.1] } }],
      }),
    );
    this._sphere.setPhysicalBody((mesh) =>
      this._physicsWorld!.addBody(mesh, {
        type: "dynamic",
        colliders: [{ shape: { type: "autoSphere" }, restitution: 0.5 }],
      }),
    );

  }

  public update(delta: number): void {
    this._physicsWorld?.step(delta);
    if (this.isKeyPressed("Space")) this.loadScene("main", false);
  }

  public override delete(): void {
    if (this._sphere?.mesh) this.removeMesh(this._sphere.mesh);
    this._sphere?.dispose(true);
    if (this._ground?.mesh) this.removeMesh(this._ground.mesh);
    this._ground?.dispose(true);
    this._physicsWorld?.dispose();
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.setControls((camera, domElement) => new StudioControls(camera, domElement));
const handleResize = () => world.resize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", handleResize);

world.addScene("main", new MainScene());
world.addScene("physics", new PhysicsScene());
await world.start("main");

// On teardown:
window.removeEventListener("resize", handleResize);
world.controls?.dispose();
world.delete();
```

## Camera Controls (`StudioControls`)

| Action                           | Input                                 | Description                                                        |
| :------------------------------- | :------------------------------------ | :----------------------------------------------------------------- |
| **Pan**                          | `Middle-Button Drag`                  | Pans the view.                                                     |
| **Activate fly-through**         | Hold `Left Alt` or right-button drag | Enables fly-through movement while held.                           |
| **Look with mouse**              | Right-button drag                     | Directly rotates camera yaw and pitch.                             |
| **Orbit rotate**                 | `Left Alt` + left-button drag          | Rotates around the OrbitControls target.                           |
| **Look with keyboard**           | Arrow keys                             | Rotates the view while fly-through is active.                      |
| **Move**                         | `W` / `A` / `S` / `D` / `Q` / `E`     | Moves relative to the camera while fly-through is active.          |

StudioControls keyboard input is ignored when focus is in an `INPUT` or `TEXTAREA` element.
Configure it with `ThreeWorld.setControls()` so the world updates it each frame and `SceneController.isKeyPressed()` reads its key state. Dispose the controls before deleting the world.

## Documentation

See the detailed interface specifications:

- [AbstractControls](./docs/abstractcontrols_specification.md) | [日本語](./docs/ja/abstractcontrols_specification.md)
- [ThreeWorld](./docs/threeworld_specification.md) | [日本語](./docs/ja/threeworld_specification.md)
- [SceneController](./docs/scenecontroller_specification.md) | [日本語](./docs/ja/scenecontroller_specification.md)
- [StudioControls](./docs/studiocontrols_specification.md) | [日本語](./docs/ja/studiocontrols_specification.md)
- [PhysicsWorld](./docs/physicsworld_specification.md) | [日本語](./docs/ja/physicsworld_specification.md)
- [IntegrateObject](./docs/integrateobject_specification.md) | [日本語](./docs/ja/integrateobject_specification.md)

## License

MIT License
