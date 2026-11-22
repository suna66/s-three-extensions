# `StudioControls` クラス インターフェース仕様

## 1. 概要
`StudioControls` は `AbstractControls` とThree.jsの `OrbitControls` をベースにしたカメラコントローラーです。中ボタンドラッグによるパン操作、フライトスルーモード中の左ボタンドラッグによるオービット回転、およびフライトスルーモード中のカメラ直接視点操作と移動を提供します。

* **依存関係:** `three`、`three/addons/controls/OrbitControls.js`、`AbstractControls`
* **エクスポート形式:** `export default class StudioControls`。`src/s-three-extensions/index.ts` から `StudioControls` として再エクスポートされます。

---

## 2. 操作モードとキー割り当て

### マウスボタン割り当てモード（内部）
`OrbitControls.mouseButtons` の設定は、ユーザーの入力状態に応じて動的に切り替わります。

| モード名 | 発動条件 | 左クリック (`LEFT`) | 中クリック (`MIDDLE`) | 右クリック (`RIGHT`) |
| :--- | :--- | :--- | :--- | :--- |
| `DefaultMode` | 通常 / 待機状態 | なし (`null`) | パン (`THREE.MOUSE.PAN`) | なし (`null`) |
| `FlyThroughMode` | 左 `Alt` キー（`AltLeft`）押下中、または右ボタンドラッグ中 | オービット回転 (`THREE.MOUSE.ROTATE`) | パン (`THREE.MOUSE.PAN`) | なし (`null`) |

### フライトスルーモード操作
左 `Alt` キー（`AltLeft`）を押している間、または右マウスボタンを押したままドラッグしている間、このモードが有効になります。右ボタンドラッグではポインターをキャプチャーしてカメラを直接回転させ、左 `Alt` キー押下中は左ボタンドラッグによる OrbitControls 回転が有効になります。通常モードでは左クリックと右クリックは OrbitControls の操作を行わず、中ボタンでパン操作を行います。

* **カメラ視点操作（回転）:**
  * **右ボタンドラッグ:** ポインターの移動量に応じてカメラのヨー（水平）とピッチ（垂直）を回転します。マウス感度は `0.003` に固定されており、ピッチ角は $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$ の範囲に制限されます。
  * **左ボタンドラッグ:** フライトスルーモードが有効な間（例: 左 `Alt` 押下中）に OrbitControls の回転が利用できます。
  * **矢印キー（`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`）:** `rotateSpeed` で設定された速度でカメラを回転します。
* **カメラ移動（並進）:**
  * `KeyW` / `KeyS`: カメラの視線方向に沿って前後移動します。
  * `KeyA` / `KeyD`: 視線方向に直交する左右方向へ移動します。
  * `KeyQ` / `KeyE`: `camera.translateY` を用いてカメラのローカルY軸に沿って上下移動します。

イベントターゲットが `INPUT` または `TEXTAREA` 要素である場合、キーボード入力は無視されます。フライトスルー移動と矢印キーによる回転はフライトスルーモードが有効な間のみ処理されます。このモードはウィンドウの `blur` 時に解除されます。

`StudioControls` インスタンスを `SceneController.controller` に設定すると、`SceneController.animate()` が毎フレーム自動的に更新し、`SceneController.isKeyPressed()` で使用するキー状態も提供されます。また、`AbstractControls` から `getKeyState()`、`flash()`、`dispose()`、`update()` および `mouseDownEvent` / `mouseMoveEvent` / `mouseUpEvent` コールバックセッターを継承しており、自身のポインター処理とあわせてこれらのコールバックも呼び出します。

---

## 3. コンストラクター

### `constructor(camera: THREE.Camera, dom: HTMLCanvasElement)`
`OrbitControls` を初期化し、初期オービットターゲットを設定して、ポインター、キーボード、ウィンドウの各イベントリスナーを登録します。

* **パラメーター:**
  * `camera` (`THREE.Camera`): 制御対象のThree.jsカメラインスタンスです。
  * `dom` (`HTMLCanvasElement`): ポインターおよびコンテキストメニューのリスナーを登録するキャンバス要素です（通常は `renderer.domElement`）。
* **初期動作:**
  * マウスボタン割り当てを `DefaultMode` に設定します。
  * `OrbitControls.target` を、カメラの現在のワールド向き（`getWorldDirection`）に沿ってカメラ前方 $1$ 単位の位置に設定します。
  * `AbstractControls` を通じて、`dom` にポインターおよびコンテキストメニューのリスナーを、`window` にキーボード、`pointerup`、`blur` の各リスナーを登録します。
  * 対象要素上でのブラウザー既定コンテキストメニューを無効化します。

---

## 4. プロパティ（セッター）

| プロパティ名 | 型 | アクセス | 既定値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| `cameraSpeed` | `number` | 書き込み専用 | `5` | フライトスルー移動（`WASDQE` キー）の移動速度を設定します。 |
| `rotateSpeed` | `number` | 書き込み専用 | `1.5` | キーボードの矢印キーによる回転速度を設定します。 |

*(注: 右ドラッグ視点回転のマウス感度 `_mouseSensitivity` は内部で `0.003` に固定されています。)*

---

## 5. メソッド

### `setDamping(factor?: number): void`
OrbitControls のダンピング（慣性）を有効にし、ダンピング係数を設定します。これは OrbitControls が管理する移動に適用され、キーボードや右ドラッグによる直接のカメラ変更には適用されません。

* **パラメーター:**
  * `factor` (`number`、省略可、既定値 `0.5`): ダンピング係数（`OrbitControls.dampingFactor`）です。値が小さいほど滑らかで長い減速になります。
* **戻り値:** `void`

---

### `disableDamping(): void`
カメラのダンピング（慣性）を無効にします。

* **パラメーター:** なし
* **戻り値:** `void`

---

### `update(delta: number): void`
コントローラーの状態を更新します（`AbstractControls` から継承）。アニメーションループ内で毎フレーム呼び出す必要があります（`SceneController.controller` に設定されている場合は自動的に呼ばれます）。

* **パラメーター:**
  * `delta` (`number`): 前フレームからの経過時間（秒）。フレームレートに依存しない移動および回転量の計算に使用されます。
* **戻り値:** `void`

---

### `dispose(): void`
`AbstractControls` から継承されています。登録されたイベントリスナーを削除し、ポインターコールバック参照をクリアします。なお、`pointerdown` リスナーは `{ capture: true }` で登録されていますが、解除時はそのオプションなしで削除されるため、生成と破棄を繰り返すと `dom` 上にハンドラーが残る場合があります。

* **パラメーター:** なし
* **戻り値:** `void`

---

## 6. 使用例

```typescript
import {
    SceneController,
    StudioControls,
    ThreeWorld,
} from "./src/s-three-extensions";

class ControlledScene extends SceneController {
    public start(): void {
        const controls = new StudioControls(this.camera, this.domElement);
        controls.cameraSpeed = 8;
        controls.rotateSpeed = 2.0;
        controls.setDamping(0.1);
        this.controller = controls;
    }

    public update(_delta: number): void {
        if (this.isKeyPressed("Space")) {
            // 押されたキーに応じた処理を記述します。
        }
    }

    public override delete(): void {
        // シーンが所有するリソースをここで解放します。
        // 注: シーン遷移の削除時には ThreeWorld が this.controller を破棄しますが、
        // world.delete() で終了する場合は必要に応じて this.controller?.dispose() を呼び出してください。
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);

window.addEventListener("resize", () => {
    world.resize(window.innerWidth, window.innerHeight);
});

world.addScene("controlled", new ControlledScene());
await world.start("controlled");

// 破棄時:
world.delete();
```
