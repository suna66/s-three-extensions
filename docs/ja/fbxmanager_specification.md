# `FBXManager` クラス インターフェース仕様

## 1. 概要
`FBXManager` は Three.js の `FBXLoader` をラップし、`.fbx` モデルを非同期またはコールバック形式で読み込むためのシングルトンクラスです。

* **依存関係:** `three`、`three/addons/loaders/FBXLoader.js`
* **エクスポート形式:** `src/s-three-extensions/loaders/FBXManager.ts` から `export default class FBXManager`（*現時点では `src/s-three-extensions/index.ts` からは再エクスポートされていません*）

---

## 2. シングルトン取得

### `static getInstance(): FBXManager`
共有の `FBXManager` インスタンスを返します（初回呼び出し時に遅延生成されます）。コンストラクターは `private` です。

* **戻り値:** `FBXManager`

---

## 3. メソッド

### `loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<THREE.Group>`
`url` から FBX ファイルを読み込み、読み込まれた `THREE.Group` で解決される Promise を返します。

* **パラメーター:**
  * `url` (`string`): FBX ファイルのパスまたは URL。
  * `onProgress` (`(event: ProgressEvent) => void`、省略可): 読み込み進捗コールバック。
* **戻り値:** `Promise<THREE.Group>`

---

### `load(url: string, onLoad: (group: THREE.Group) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: unknown) => void): void`
コールバック形式で `url` から FBX ファイルを読み込みます。

* **パラメーター:**
  * `url` (`string`): FBX ファイルのパスまたは URL。
  * `onLoad` (`(group: THREE.Group) => void`): 読み込まれた `THREE.Group` を受け取るコールバック。
  * `onProgress` (`(event: ProgressEvent) => void`、省略可): 読み込み進捗コールバック。
  * `onError` (`(err: unknown) => void`、省略可): エラー発生時のコールバック。
* **戻り値:** `void`

---

## 4. 使用例

```typescript
import FBXManager from "./src/s-three-extensions/loaders/FBXManager";
import { disposeObject3D } from "./src/s-three-extensions/ExtensionUtils";

const fbxManager = FBXManager.getInstance();
const group = await fbxManager.loadAsync("/models/character.fbx");
scene.add(group);

// 破棄時:
disposeObject3D(group, true);
```
