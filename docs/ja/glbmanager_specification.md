# `GLBManager` クラス インターフェース仕様

## 1. 概要
`GLBManager` は Three.js の `GLTFLoader` をラップし、`.glb` / `.gltf` モデルを非同期またはコールバック形式で読み込むためのシングルトンクラスです。

* **依存関係:** `three/addons/loaders/GLTFLoader.js`
* **エクスポート形式:** `src/s-three-extensions/loaders/GLBManager.ts` から `export default class GLBManager`（*現時点では `src/s-three-extensions/index.ts` からは再エクスポートされていません*）

---

## 2. シングルトン取得

### `static getInstance(): GLBManager`
共有の `GLBManager` インスタンスを返します（初回呼び出し時に遅延生成されます）。コンストラクターは `private` です。

* **戻り値:** `GLBManager`

---

## 3. メソッド

### `loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<GLTF>`
`url` から glTF/GLB ファイルを読み込み、読み込まれた `GLTF` オブジェクトで解決される Promise を返します。

* **パラメーター:**
  * `url` (`string`): glTF/GLB ファイルのパスまたは URL。
  * `onProgress` (`(event: ProgressEvent) => void`、省略可): 読み込み進捗コールバック。
* **戻り値:** `Promise<GLTF>`

---

### `load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: unknown) => void): void`
コールバック形式で `url` から glTF/GLB ファイルを読み込みます。

* **パラメーター:**
  * `url` (`string`): glTF/GLB ファイルのパスまたは URL。
  * `onLoad` (`(gltf: GLTF) => void`): 読み込まれた `GLTF` オブジェクトを受け取るコールバック。
  * `onProgress` (`(event: ProgressEvent) => void`、省略可): 読み込み進捗コールバック。
  * `onError` (`(err: unknown) => void`、省略可): エラー発生時のコールバック。
* **戻り値:** `void`

---

## 4. 使用例

```typescript
import GLBManager from "./src/s-three-extensions/loaders/GLBManager";
import { disposeObject3D } from "./src/s-three-extensions/ExtensionUtils";

const glbManager = GLBManager.getInstance();
const gltf = await glbManager.loadAsync("/models/scene.glb");
scene.add(gltf.scene);

// 破棄時:
disposeObject3D(gltf.scene, true);
```
