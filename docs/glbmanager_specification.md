# `GLBManager` Class Interface Specification

## 1. Overview
`GLBManager` is a singleton wrapper around Three.js's `GLTFLoader` for loading `.glb` / `.gltf` models asynchronously or with callbacks.

* **Dependencies:** `three/addons/loaders/GLTFLoader.js`
* **Export Format:** `export default class GLBManager` from `src/s-three-extensions/loaders/GLBManager.ts` *(not currently re-exported from `src/s-three-extensions/index.ts`)*

---

## 2. Singleton Access

### `static getInstance(): GLBManager`
Returns the shared `GLBManager` instance, creating it lazily on first call. The constructor is `private`.

* **Returns:** `GLBManager`

---

## 3. Methods

### `loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<GLTF>`
Loads a glTF/GLB file from `url` and resolves with the loaded `GLTF` object.

* **Parameters:**
  * `url` (`string`): Path or URL to the glTF/GLB file.
  * `onProgress` (`(event: ProgressEvent) => void`, optional): Progress callback.
* **Returns:** `Promise<GLTF>`

---

### `load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: unknown) => void): void`
Loads a glTF/GLB file from `url` using callbacks.

* **Parameters:**
  * `url` (`string`): Path or URL to the glTF/GLB file.
  * `onLoad` (`(gltf: GLTF) => void`): Callback invoked with the loaded `GLTF` object.
  * `onProgress` (`(event: ProgressEvent) => void`, optional): Progress callback.
  * `onError` (`(err: unknown) => void`, optional): Error callback.
* **Returns:** `void`

---

## 4. Usage Example

```typescript
import GLBManager from "./src/s-three-extensions/loaders/GLBManager";
import { disposeObject3D } from "./src/s-three-extensions/ExtensionUtils";

const glbManager = GLBManager.getInstance();
const gltf = await glbManager.loadAsync("/models/scene.glb");
scene.add(gltf.scene);

// On teardown:
disposeObject3D(gltf.scene, true);
```
