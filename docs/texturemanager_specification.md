# `TextureManager` Class Interface Specification

## 1. Overview
`TextureManager` is a singleton wrapper around `THREE.TextureLoader` for loading image textures asynchronously or with callbacks.

* **Dependencies:** `three`
* **Export Format:** `export default class TextureManager` from `src/s-three-extensions/loaders/TextureManager.ts` *(not currently re-exported from `src/s-three-extensions/index.ts`)*

---

## 2. Singleton Access

### `static getInstance(): TextureManager`
Returns the shared `TextureManager` instance, creating it lazily on first call. The constructor is `private`.

* **Returns:** `TextureManager`

---

## 3. Methods

### `loadAsync(filename: string, onProgress?: (event: ProgressEvent) => void): Promise<THREE.Texture>`
Loads a texture from `filename` and resolves with the loaded `THREE.Texture`.

* **Parameters:**
  * `filename` (`string`): Path or URL to the texture image.
  * `onProgress` (`(event: ProgressEvent) => void`, optional): Progress callback.
* **Returns:** `Promise<THREE.Texture>`

---

### `load(filename: string, onLoad?: (texture: THREE.Texture) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: unknown) => void): THREE.Texture`
Starts loading a texture from `filename` and returns the `THREE.Texture` instance immediately (which updates once loading finishes).

* **Parameters:**
  * `filename` (`string`): Path or URL to the texture image.
  * `onLoad` (`(texture: THREE.Texture) => void`, optional): Callback invoked once the texture finishes loading.
  * `onProgress` (`(event: ProgressEvent) => void`, optional): Progress callback.
  * `onError` (`(err: unknown) => void`, optional): Error callback.
* **Returns:** `THREE.Texture`

---

## 4. Usage Example

```typescript
import * as THREE from "three";
import TextureManager from "./src/s-three-extensions/loaders/TextureManager";

const textureManager = TextureManager.getInstance();
const texture = await textureManager.loadAsync("/textures/albedo.png");
const material = new THREE.MeshStandardMaterial({ map: texture });

// On teardown:
texture.dispose();
material.dispose();
```
