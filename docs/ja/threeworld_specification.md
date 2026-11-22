# `ThreeWorld` クラス インターフェース仕様

## 1. 概要
`ThreeWorld` は透視カメラ、WebGPUレンダラー、フレームタイマー、およびキーで管理される `SceneController` インスタンスのライフサイクルを管理します。各コントローラーは個別の `THREE.Scene`、カメラコントロール、および任意の `PhysicsWorld` を所有します。

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
* **初期動作:** 上記の既定値でカメラを設定し、アンチエイリアスを有効にしてレンダラーを作成します。タイマーを `document` に接続します。

---

## 4. プロパティ（ゲッター）

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `camera` | `THREE.PerspectiveCamera` | 読み取り専用 | 内部の透視カメラです。 |
| `renderer` | `THREE.WebGPURenderer` | 読み取り専用 | 内部のWebGPUレンダラーです。 |
| `domElement` | `HTMLCanvasElement` | 読み取り専用 | レンダラーのキャンバス（`renderer.domElement`）です。 |

---

## 5. メソッド

### `addScene(key: string, scene: SceneController): void`
コントローラーをこのワールドで初期化し（`scene.init(this)`）、`key` に登録します。

### `loadScene(key: string, isDelete: boolean = true): boolean`
登録済みコントローラーへの遷移を要求します。`key` が登録されていない場合は `false` を返します。遷移先コントローラーは直ちに再開され（`resume()`）、次のアニメーションフレームでアクティブになります。`isDelete` が `true` の場合、遷移元コントローラーは削除（`delete()`）および破棄（`dispose()`）され、レジストリからも取り除かれます。`false` の場合は一時停止（`suspend()`）され、後で再開できます。

### `setCameraPosition(x: number, y: number, z: number): void`
カメラのワールド座標上の位置を設定します。

### `resize(width: number, height: number): void`
カメラのアスペクト比と投影行列を更新し、レンダラーのサイズも更新します。

### `async start(startScene: string): Promise<void>`
レンダラーを初期化し、`startScene` に登録されたコントローラーを選択してその `start()` メソッドを呼び出し、レンダーループを開始します。キーに対応するコントローラーが登録されていない場合、ループを開始せずに終了します。各フレームではタイマーを更新し、経過時間 `delta` を最大 `0.1` 秒にクランプした上で、保留中のシーン遷移を適用し、アクティブなコントローラーの `animate(delta)` を呼び出してから、その `scene` を内部カメラで描画します。

### `delete(): void`
インスタンスを破棄済みとしてマークし、アニメーションループを停止（`setAnimationLoop(null)`）した上で、登録済み・アクティブな全コントローラーに対して `delete()` と `dispose()` を呼び出し、シーンスタックをクリアし、タイマーの切断・破棄およびレンダラーの破棄を行います。

---

## 6. SceneController との関係
`SceneController` は `THREE.Scene` を所有し、通常 `addScene()` から呼び出される `init(space)` を通じて `ThreeWorld` インスタンスを受け取ります。シーン、カメラ、キャンバスを公開し、`start(): void` と `update(delta: number): void` の実装を要求します。コントローラーは自身の `controller`（`AbstractControls`）や任意の `physicsWorld`（`PhysicsWorld`）を管理し、保護された `loadScene()` および `addScene()` メソッドを通じてキー付きシーン遷移や新規シーン登録を行えます。

---

## 7. 使用例

```typescript
import * as THREE from "three";
import {
    SceneController,
    SceneObject,
    StudioControls,
    ThreeWorld,
} from "./src/s-three-extensions";

class SampleScene extends SceneController {
    private cube: SceneObject | null = null;

    public start(): void {
        this.controller = new StudioControls(this.camera, this.domElement);
        this.cube = new SceneObject(() => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            return new THREE.Mesh(geometry, material);
        });
        this.addSceneObject(this.cube);
    }

    public update(delta: number): void {
        if (!this.cube?.mesh) return;
        this.cube.mesh.rotation.x += delta;
        this.cube.mesh.rotation.y += delta;
    }

    public override delete(): void {
        this.removeAllSceneObjects();
        this.cube?.dispose(true);
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.addScene("sample", new SampleScene());

const handleResize = () => world.resize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", handleResize);

await world.start("sample");

// 破棄時:
window.removeEventListener("resize", handleResize);
world.delete();
```
