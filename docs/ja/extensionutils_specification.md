# `ExtensionUtils` モジュール インターフェース仕様

## 1. 概要
`ExtensionUtils` は、要素のリサイズ監視や Three.js の `Mesh`・`Light` リソースの安全な破棄を行うためのスタンドアロンユーティリティ関数群を提供します。

* **依存関係:** `three`
* **エクスポート形式:** `src/s-three-extensions/ExtensionUtils.ts` から `addResizeCallback`、`removeResizeCallback`、`disposeMesh`、`disposeLight` を名前付きエクスポート（`src/s-three-extensions/index.ts` から再エクスポート）。

---

## 2. 関数一覧

### `addResizeCallback(dom: HTMLElement, callback: (width: number, height: number, pixelRatio: number) => void): ResizeObserver`
`dom` を監視する `ResizeObserver` を作成します。リサイズが発生し `entries[0]` が存在する場合、`entry.contentRect` の `width`・`height` と `window.devicePixelRatio` を引数にして `callback` を呼び出します。

* **パラメーター:**
  * `dom` (`HTMLElement`): 監視対象の要素。
  * `callback`: `width`、`height`、`pixelRatio` を受け取るコールバック関数。
* **戻り値:** 作成された `ResizeObserver` インスタンス。

---

### `removeResizeCallback(resizeObserver: ResizeObserver): void`
指定された `ResizeObserver` の監視を切断（`disconnect()`）します。

* **パラメーター:**
  * `resizeObserver` (`ResizeObserver`): `addResizeCallback()` で返されたオブザーバー。
* **戻り値:** `void`

---

### `disposeMesh(mesh: THREE.Mesh | null, disposeGeometryAndMaterial: boolean = false): void`
Three.js のメッシュを親から切り離して破棄します。`mesh` が `null` の場合は何もしません。
1. `mesh.removeFromParent()` を呼び出します。
2. `mesh` が `dispose()` メソッドを持つ場合（例: `THREE.BatchedMesh`）、`mesh.dispose()` を呼び出します。
3. `disposeGeometryAndMaterial` が `true` の場合、`mesh.geometry?.dispose()` を呼び出し、`mesh.material`（配列の場合は各要素）を `.dispose()` します。

* **パラメーター:**
  * `mesh` (`THREE.Mesh | null`): 破棄対象のメッシュ。
  * `disposeGeometryAndMaterial` (`boolean`、省略可、既定値 `false`): ジオメトリとマテリアルも破棄するかどうか。
* **戻り値:** `void`

---

### `disposeLight(light: THREE.Light | null, deleteAllResources: boolean = false): void`
Three.js のライトを親から切り離して破棄します。`light` が `null` の場合は何もしません。
1. `light.removeFromParent()` を呼び出します。
2. `light` が `THREE.Object3D` インスタンスの `target` プロパティを持つ場合（例: `DirectionalLight`、`SpotLight`）、`light.target.removeFromParent()` を呼び出します。
3. `deleteAllResources` が `true` かつ `light` が `THREE.Texture` インスタンスの `map` プロパティを持つ場合、`light.map.dispose()` を呼び出して `light.map = null` にします。
4. `light.dispose()` を呼び出します。

* **パラメーター:**
  * `light` (`THREE.Light | null`): 破棄対象のライト。
  * `deleteAllResources` (`boolean`、省略可、既定値 `false`): 関連付けられた `map` テクスチャも破棄するかどうか。
* **戻り値:** `void`

---

## 3. 使用例

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

// 終了時:
disposeMesh(mesh, true);
disposeLight(light, true);
removeResizeCallback(observer);
world.delete();
```
