# `TextureManager` クラス インターフェース仕様

## 1. 概要
`TextureManager` は `THREE.TextureLoader` をラップし、画像テクスチャを非同期またはコールバック形式で読み込むためのシングルトンクラスです。

* **依存関係:** `three`
* **エクスポート形式:** `src/s-three-extensions/loaders/TextureManager.ts` から `export default class TextureManager`（*現時点では `src/s-three-extensions/index.ts` からは再エクスポートされていません*）

---

## 2. シングルトン取得

### `static getInstance(): TextureManager`
共有の `TextureManager` インスタンスを返します（初回呼び出し時に遅延生成されます）。コンストラクターは `private` です。

* **戻り値:** `TextureManager`

---

## 3. メソッド

### `loadAsync(filename: string, onProgress?: (event: ProgressEvent) => void): Promise<THREE.Texture>`
`filename` からテクスチャを読み込み、読み込まれた `THREE.Texture` で解決される Promise を返します。

* **パラメーター:**
  * `filename` (`string`): テクスチャ画像のパスまたは URL。
  * `onProgress` (`(event: ProgressEvent) => void`、省略可): 読み込み進捗コールバック。
* **戻り値:** `Promise<THREE.Texture>`

---

### `load(filename: string, onLoad?: (texture: THREE.Texture) => void, onProgress?: (event: ProgressEvent) => void, onError?: (err: unknown) => void): THREE.Texture`
`filename` からテクスチャの読み込みを開始し、`THREE.Texture` インスタンスを即座に返します（読み込み完了後に内容が更新されます）。

* **パラメーター:**
  * `filename` (`string`): テクスチャ画像のパスまたは URL。
  * `onLoad` (`(texture: THREE.Texture) => void`、省略可): 読み込み完了時に呼ばれるコールバック。
  * `onProgress` (`(event: ProgressEvent) => void`、省略可): 読み込み進捗コールバック。
  * `onError` (`(err: unknown) => void`、省略可): エラー発生時のコールバック。
* **戻り値:** `THREE.Texture`

---

## 4. 使用例

```typescript
import * as THREE from "three";
import TextureManager from "./src/s-three-extensions/loaders/TextureManager";

const textureManager = TextureManager.getInstance();
const texture = await textureManager.loadAsync("/textures/albedo.png");
const material = new THREE.MeshStandardMaterial({ map: texture });

// 破棄時:
texture.dispose();
material.dispose();
```
