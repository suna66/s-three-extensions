# s-three-extensions

A utility and extension library designed to streamline prototyping and 3D scene construction with Three.js (WebGPU).  
It provides a clean, minimal API to eliminate boilerplate WebGPU renderer setup and adds intuitive, DCC-style (Unreal Engine / Unity) viewport camera controls.

---

## ✨ Features

- **`ThreeSpace`**:
    - Centrally manages the initialization and lifecycle of `Scene`, `PerspectiveCamera`, `WebGPURenderer`, and `Timer`.
    - Simplifies viewport resizing, grid helper creation, mesh addition, and GPU resource disposal (`dispose`).
- **`StudioControls`**:
    - Extends `OrbitControls` to deliver viewport navigation inspired by 3D content creation tools.
    - Supports middle-click panning alongside seamless switching into fly-through (walk-through) mode by holding the **right mouse button** or the **`Alt` key**.

---

## 📦 Requirements

- **Three.js**: A version supporting WebGPU (`three/webgpu`) and `OrbitControls` (e.g., `r170` or later recommended)
- **TypeScript**: 5.x recommended
- **Browser**: A WebGPU-enabled browser

---

## 🚀 Installation

To install directly from a GitHub repository:

```bash
npm install github:suna66/s-three-extensions
```

Alternatively, you can copy the source files (`ThreeSpace.ts`, `StudioControls.ts`) directly into your project.

---

## 🛠️ Quick Start

A minimal setup example combining `ThreeSpace` and `StudioControls` to launch a 3D scene with a grid and a rotating cube:

```typescript
import * as THREE from "three/webgpu";
import ThreeSpace from "./ThreeSpace";
import StudioControls from "./StudioControls";

// 1. Initialize the 3D space
const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const space = new ThreeSpace(canvas, window.innerWidth, window.innerHeight);

// 2. Initialize studio-style camera controls
const controls = new StudioControls(space.camera, space.domElement);
controls.cameraSpeed = 8;
controls.setDamping(0.1);

// 3. Add grid helper and mesh
space.addGridHelper(20, 20);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
const cube = new THREE.Mesh(geometry, material);
space.addScene(cube);

// 4. Handle window resize
window.addEventListener("resize", () => {
    space.resize(window.innerWidth, window.innerHeight);
});

// 5. Start the animation loop
space.start((delta) => {
    controls.update(delta);

    cube.rotation.x += 1.0 * delta;
    cube.rotation.y += 1.0 * delta;
});

// 6. Cleanup (when unmounting or disposing)
// controls.dispose();
// space.removeMesh(cube, true);
// space.delete();
```

---

## 🎮 Camera Controls Guide (`StudioControls`)

| Action                           | Input                                 | Description                                                        |
| :------------------------------- | :------------------------------------ | :----------------------------------------------------------------- |
| **Pan**                          | `Middle-Click Drag`                   | Moves the camera laterally (up, down, left, right).                |
| **Enable Fly-Through**           | `Right-Click Drag` or `Hold Left Alt` | Activates walk-through navigation mode while held.                 |
| **Look / Rotate View**           | `Right-Click Move` or `Arrow Keys`    | Rotates the camera view direction while fly-through is active.     |
| **Move Forward / Back / Strafe** | `W` / `A` / `S` / `D`                 | Moves relative to the view direction while fly-through is active.  |
| **Move Up / Down (Elevate)**     | `Q` / `E`                             | Moves along the camera's local Y-axis while fly-through is active. |
| **Orbit Rotate**                 | `Left Alt` + `Left-Click Drag`        | Orbits the camera around the target point.                         |

_(Note: Keyboard controls are automatically ignored while focus is inside an `INPUT` or `TEXTAREA` element.)_

---

## 📚 Documentation

For detailed method and property specifications of each class, please refer to the interface documentation:

- [`ThreeSpace` Class Interface Specification](./ThreeSpace_specification_en.md)
- [`StudioControls` Class Interface Specification](./StudioControls_specification_en.md)

---

## 📝 License

MIT License
