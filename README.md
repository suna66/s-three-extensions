# s-three-extensions

Utilities for building Three.js scenes with a WebGPU renderer and DCC-style viewport camera controls.

## Features

- **`ThreeWorld`**:
  - Manages a perspective camera, WebGPU renderer, frame timer, and scene-controller lifecycle.
  - Provides viewport resizing, keyboard-state queries, and keyed scene switching.
- **`StudioControls`**:
  - Wraps `OrbitControls` with middle-button panning and fly-through controls.
  - Supports right-button look, left-Alt activation, WASDQE movement, and arrow-key rotation.
- **`SceneController`**:
  - Abstract base class for a scene's startup, per-frame update, and cleanup logic.
  - Provides protected helpers for adding/removing meshes, checking pressed keys, and requesting scene switches.
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

The source barrel at `src/s-three-extensions/index.ts` exports `ThreeWorld`, `StudioControls`, `SceneController`, `PhysicsWorld`, `IntegrateObject`, and related helpers and types.

## Quick Start

Create a `SceneController` subclass, register it with `ThreeWorld.addScene()`, then start the world with that scene's key. `StudioControls` should be created after the controller has been initialized, because it needs the controller's camera and canvas.

```typescript
import * as THREE from "three/webgpu";
import { SceneController, StudioControls, ThreeWorld } from "./src/s-three-extensions";

class SampleScene extends SceneController {
    private controls: StudioControls | null = null;
    private cube: THREE.Mesh | null = null;

    public start(): void {
        this.controls = new StudioControls(this.camera, this.domElement);
        this.controls.cameraSpeed = 8;
        this.controls.setDamping(0.1);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        this.cube = new THREE.Mesh(geometry, material);
        this.addMesh(this.cube);
    }

    public update(delta: number): void {
        this.controls?.update(delta);
        if (this.cube) {
            this.cube.rotation.x += delta;
            this.cube.rotation.y += delta;
        }
    }

    public override delete(): void {
        this.controls?.dispose();
      if (this.cube) {
        this.removeMesh(this.cube);
        this.cube.geometry.dispose();
        const materials = Array.isArray(this.cube.material)
          ? this.cube.material
          : [this.cube.material];
        materials.forEach((material) => material.dispose());
      }
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
const handleResize = () => {
  world.resize(window.innerWidth, window.innerHeight);
};
window.addEventListener("resize", handleResize);

world.addScene("sample", new SampleScene());
await world.start("sample");

// On teardown:
window.removeEventListener("resize", handleResize);
// world.delete();
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

## Documentation

See the detailed interface specifications:

- [ThreeWorld](./docs/threeworld_specification.md) | [日本語](./docs/ja/threeworld_specification.md)
- [SceneController](./docs/scenecontroller_specification.md) | [日本語](./docs/ja/scenecontroller_specification.md)
- [StudioControls](./docs/studiocontrols_specification.md) | [日本語](./docs/ja/studiocontrols_specification.md)
- [PhysicsWorld](./docs/physicsworld_specification.md) | [日本語](./docs/ja/physicsworld_specification.md)
- [IntegrateObject](./docs/integrateobject_specification.md) | [日本語](./docs/ja/integrateobject_specification.md)

## License

MIT License
