# `ThreeWorld` クラス インターフェース仕様

## 1. 概要
`ThreeWorld` は透視カメラ、WebGPUレンダラー、フレームタイマー、キーボード状態、およびキーで管理される `SceneController` インスタンスのライフサイクルを管理します。各コントローラーは個別の `THREE.Scene` を所有します。

* **依存関係:** `three/webgpu`、`SceneController`
* **エクスポート形式:** `export default class ThreeWorld`。`src/s-three-extensions/index.ts` から `ThreeWorld` として再エクスポートされます。

---

## 2. 既定値（内部定数）

| 定数名 | 値 | 説明 |
| :--- | :--- | :--- |
| `DEFAULT_FOV` | `75` | カメラの視野角（度） |
| `DEFAULT_NEAR` | `0.1` | カメラのニアクリップ面 |
| `DEFAULT_FAR` | `1000` | カメラのファークリップ面 |
| `DEFAULT_START_Z_POSITION` | `10` | カメラの初期位置は `(0, 0, 10)` |

---

## 3. コンストラクター

### `constructor(canvas: HTMLCanvasElement, width: number, height: number)`
`PerspectiveCamera`、`WebGPURenderer`、`THREE.Timer` を作成します。

* **パラメーター:** `canvas` はレンダラーに渡すキャンバスです。`width` と `height` は初期レンダラーサイズとカメラのアスペクト比に使われます。
* **初期動作:** 上記の既定値でカメラを設定し、アンチエイリアスを有効にしてレンダラーを作成します。タイマーを `document` に接続し、押下中の `KeyboardEvent.code` を追跡する `keydown` / `keyup` リスナーを `window` に登録します。

---

## 4. プロパティ（ゲッター）

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `camera` | `THREE.PerspectiveCamera` | 読み取り専用 | 内部の透視カメラです。 |
| `renderer` | `THREE.WebGPURenderer` | 読み取り専用 | 内部のWebGPUレンダラーです。 |
| `domElement` | `HTMLCanvasElement` | 読み取り専用 | レンダラーのキャンバス（`renderer.domElement`）です。 |

---

## 5. メソッド

### `isKeyPressed(key: string): boolean`
指定したキーボードコードが現在押されているかを返します。`"KeyW"` や `"ArrowUp"` のような `KeyboardEvent.code` の値を渡してください。

### `addScene(key: string, scene: SceneController): void`
コントローラーをこのワールドで初期化し、`key` に登録します。

### `loadScene(key: string, isDelete: boolean = true): boolean`
登録済みコントローラーへの遷移を要求します。`key` が登録されていない場合は `false` を返します。遷移先コントローラーは直ちに再開され、次のアニメーションフレームでアクティブになり、押下中のキーセットがクリアされます。`isDelete` が `true` の場合、遷移元コントローラーは削除されレジストリからも取り除かれます。`false` の場合は一時停止され、後で再開できます。

### `setCameraPosition(x: number, y: number, z: number): void`
カメラのワールド座標上の位置を設定します。

### `resize(width: number, height: number): void`
カメラのアスペクト比と投影行列を更新し、レンダラーのサイズも更新します。

### `async start(startScene: string): Promise<void>`
レンダラーを初期化し、`startScene` に登録されたコントローラーを選択して、その `start()` を呼び出し、描画ループを設定します。指定キーにコントローラーが登録されていない場合、描画ループを開始せずに戻ります。各フレームではタイマーを更新し、保留中のシーン遷移を適用した後、アクティブなコントローラーの `update(delta)` を呼び出します。`delta` は前回フレームからの経過秒数です。その後、内部カメラでコントローラーの `scene` を描画します。

### `delete(): void`
インスタンスを破棄済みにし、アクティブなコントローラーがあればその `delete()` を呼び出します。また、`window` のキーボードリスナーを削除し、タイマーを切断・破棄します。このメソッドはレンダラーを明示的には破棄しません。

---

## 6. `SceneController` との関係
`SceneController` は `THREE.Scene` を所有し、通常は `addScene()` によって呼び出される `init(world)` を通じて `ThreeWorld` インスタンスを受け取ります。シーン、カメラ、キャンバスを公開し、`start(): void` と `update(delta: number): void` の実装を要求します。コントローラーは保護メソッド `loadScene()` でキーを指定した遷移を要求できます。`addMesh()` や `removeMesh()` などのメッシュ補助メソッドはコントローラーに属します。

---

## 7. 使用例

```typescript
import * as THREE from "three/webgpu";
import ThreeWorld from "./ThreeWorld";
import { SceneController } from "./SceneController";

class SampleScene extends SceneController {
    private cube: THREE.Mesh | null = null;

    public start(): void {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.addMesh(this.cube);
    }

    public update(delta: number): void {
        if (!this.cube) return;
        this.cube.rotation.x += delta;
        this.cube.rotation.y += delta;
    }

    public override delete(): void {
        if (this.cube) this.removeMesh(this.cube, true);
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.addScene("sample", new SampleScene());

window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight);
});

await world.start("sample");

// 終了時:
// world.delete();
```
