# `FBXManager` Class Interface Specification

## 1. Overview
`FBXManager` is a singleton wrapper around Three.js's `FBXLoader` for loading `.fbx` models asynchronously or with callbacks.

* **Dependencies:** `three`, `three/addons/loaders/FBXLoader.js`
* **Export Format:** `export default class FBXManager` from `src/s-three-extensions/loaders/FBXManager.ts` *(not currently re-exported from `src/s-three-extensions/index.ts`)*

---

## 2. Singleton Access

### `static getInstance(): FBXManager`
Returns the shared `FBXManager` instance, creating it lazily on first call. The constructor is `private`.

* **Returns:** `FBXManager`

---

## 3. Methods

### `loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<THREE.Group>`
Loads an FBX file from `url` and resolves with the loaded `THREE.Group`.

* **Parameters:**
  * `url` (`string`): Path or URL to the FBX file.
  * `onProgress` (`(event: ProgressEvent) => void`, optional): Progress callback.
* **Returns:** `Promise<THREE.Group>`

---

### `load(url: string, onLoad: (group: THREE.Group) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: unknown) => void): void`
Loads an FBX file from `url` using callbacks.

* **Parameters:**
  * `url` (`string`): Path or URL to the FBX file.
  * `onLoad` (`(group: THREE.Group) => void`): Callback invoked with the loaded `THREE.Group`.
  * `onProgress` (`(event: ProgressEvent) => void`, optional): Progress callback.
  * `onError` (`(err: unknown) => void`, optional): Error callback.
* **Returns:** `void`

---

## 4. Usage Example

```typescript
import FBXManager from "./src/s-three-extensions/loaders/FBXManager";
import { disposeObject3D } from "./src/s-three-extensions/ExtensionUtils";

const fbxManager = FBXManager.getInstance();
const group = await fbxManager.loadAsync("/models/character.fbx");
scene.add(group);

// On teardown:
disposeObject3D(group, true);
```
