# `ExtensionUtils` Module Interface Specification

## 1. Overview
`ExtensionUtils` provides standalone utility functions for observing element resizing and safely disposing Three.js `Mesh` and `Light` resources.

* **Dependencies:** `three`
* **Export Format:** Named exports `addResizeCallback`, `removeResizeCallback`, `disposeMesh`, and `disposeLight` from `src/s-three-extensions/ExtensionUtils.ts`, re-exported from `src/s-three-extensions/index.ts`

---

## 2. Functions

### `addResizeCallback(dom: HTMLElement, callback: (width: number, height: number, pixelRatio: number) => void): ResizeObserver`
Creates a `ResizeObserver` observing `dom`. Whenever `dom` resizes and `entries[0]` is present, invokes `callback(width, height, window.devicePixelRatio)` using `entry.contentRect`.

* **Parameters:**
  * `dom` (`HTMLElement`): The element to observe.
  * `callback`: Callback receiving `width`, `height`, and `pixelRatio`.
* **Returns:** The created `ResizeObserver` instance.

---

### `removeResizeCallback(resizeObserver: ResizeObserver): void`
Disconnects the given `ResizeObserver`.

* **Parameters:**
  * `resizeObserver` (`ResizeObserver`): The observer returned by `addResizeCallback()`.
* **Returns:** `void`

---

### `disposeMesh(mesh: THREE.Mesh | null, disposeGeometryAndMaterial: boolean = false): void`
Detaches and disposes a Three.js mesh. Does nothing if `mesh` is `null`.
1. Calls `mesh.removeFromParent()`.
2. If `mesh` defines a `dispose()` method (for example, `THREE.BatchedMesh`), calls `mesh.dispose()`.
3. When `disposeGeometryAndMaterial` is `true`, calls `mesh.geometry?.dispose()` and disposes `mesh.material` (or each material when `mesh.material` is an array).

* **Parameters:**
  * `mesh` (`THREE.Mesh | null`): The mesh to dispose.
  * `disposeGeometryAndMaterial` (`boolean`, optional, default: `false`): Whether to also dispose geometry and material(s).
* **Returns:** `void`

---

### `disposeLight(light: THREE.Light | null, deleteAllResources: boolean = false): void`
Detaches and disposes a Three.js light. Does nothing if `light` is `null`.
1. Calls `light.removeFromParent()`.
2. If `light` has a `target` property that is an instance of `THREE.Object3D` (for example, `DirectionalLight` or `SpotLight`), calls `light.target.removeFromParent()`.
3. When `deleteAllResources` is `true` and `light` has a `map` property that is an instance of `THREE.Texture`, calls `light.map.dispose()` and sets `light.map = null`.
4. Calls `light.dispose()`.

* **Parameters:**
  * `light` (`THREE.Light | null`): The light to dispose.
  * `deleteAllResources` (`boolean`, optional, default: `false`): Whether to also dispose an attached `map` texture.
* **Returns:** `void`

---

## 3. Usage Example

```typescript
import * as THREE from "three";
import {
    ThreeWorld,
    addResizeCallback,
    disposeLight,
    disposeMesh,
    removeResizeCallback,
} from "./src/s-three-extensions";

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, canvas.clientWidth, canvas.clientHeight);

const observer = addResizeCallback(canvas, (width, height) => {
    world.resize(width, height);
});

const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial(),
);
const light = new THREE.DirectionalLight(0xffffff, 1);

// On teardown:
disposeMesh(mesh, true);
disposeLight(light, true);
removeResizeCallback(observer);
world.delete();
```
