# `StudioControls` クラス インターフェース仕様

## 1. 概要
`StudioControls` は `AbstractControls` とThree.jsの `OrbitControls` を基にしたカメラコントローラーです。中ボタンでのパン、フライスルーモード中の左ボタンによるオービット回転、およびフライスルーモード中のカメラ視点操作と移動を提供します。

* **依存関係:** `three`、`three/addons/controls/OrbitControls.js`、`AbstractControls`
* **エクスポート形式:** `export default class StudioControls`

---

## 2. 操作モードとキー割り当て

### マウスボタンの割り当てモード（内部）
ユーザーの入力状態に応じて、`OrbitControls.mouseButtons` の設定が切り替わります。

| モード名 | 有効になる条件 | 左クリック（`LEFT`） | 中クリック（`MIDDLE`） | 右クリック（`RIGHT`） |
| :--- | :--- | :--- | :--- | :--- |
| `DefaultMode` | 初期状態 / アイドル | なし（`null`） | パン（`THREE.MOUSE.PAN`） | なし（`null`） |
| `FlyThroughMode` | 左 `Alt` キー（`AltLeft`）を押している、または右ボタンをドラッグ中 | オービット回転（`THREE.MOUSE.ROTATE`） | パン（`THREE.MOUSE.PAN`） | なし（`null`） |

### フライスルーモードの操作
左 `Alt` キー（`AltLeft`）を押している間、またはマウス右ボタンをドラッグしている間にモードが有効になります。右ボタンのドラッグではポインターもキャプチャされ、カメラが直接回転します。左 `Alt` キーを押すと、左ボタンで `OrbitControls` の回転操作が行えます。通常モードでは左・右クリックに `OrbitControls` の操作は割り当てられず、中ボタンでパンします。

* **カメラの視点操作（回転）:**
  * **右ボタンのドラッグ:** ポインターの移動量に応じて、カメラのヨー（水平）とピッチ（垂直）を回転させます。マウス感度は `0.003` 固定です。ピッチは $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$ の範囲に制限されます。
  * **左ボタンのドラッグ:** フライスルーモードが有効な間（例: 左 `Alt` キーを押している間）、`OrbitControls` による回転が使えます。
  * **矢印キー（`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`）:** `rotateSpeed` で指定した速度でカメラを回転させます。
* **カメラの移動（平行移動）:**
  * `KeyW` / `KeyS`: カメラの視線方向に前進 / 後退します。
  * `KeyA` / `KeyD`: 視線方向に垂直な方向へ左右に移動します。
  * `KeyQ` / `KeyE`: `camera.translateY` を使い、カメラのローカルY軸方向に上下移動します。

イベント対象が `INPUT` または `TEXTAREA` 要素の場合、キーボード入力は無視されます。フライスルー移動と矢印キーによる回転は、フライスルーモード中のみ処理されます。ウィンドウがフォーカスを失うとモードは解除されます。

`ThreeWorld.setControls()` で `StudioControls` を登録すると、ワールドが毎フレーム更新します。また、`SceneController.isKeyPressed()` が参照するキー状態も提供されます。`getKeyState()`、`flash()`、`dispose()`、`update()` は `AbstractControls` から継承します。

---

## 3. コンストラクター

### `constructor(camera: THREE.Camera, dom: HTMLCanvasElement)`
`OrbitControls` を初期化し、初期オービットターゲットを設定して、ポインター・キーボード・ウィンドウのイベントリスナーを登録します。

* **パラメーター:**
  * `camera` (`THREE.Camera`): 操作対象のThree.jsカメラです。
  * `dom` (`HTMLCanvasElement`): ポインターとコンテキストメニューのリスナーを取り付けるキャンバスです（通常は `renderer.domElement`）。
* **初期動作:**
  * マウスボタンの割り当てを `DefaultMode` に設定します。
  * `OrbitControls.target` を、カメラの現在のワールド方向（`getWorldDirection`）へ1単位進んだ位置に設定します。
  * `AbstractControls` を通じて `dom` にポインターとコンテキストメニューのリスナーを、`window` にキーボード、ポインターアップ、フォーカス喪失のリスナーを登録します。
  * 対象要素上でブラウザー標準のコンテキストメニューが表示されないようにします。

---

## 4. プロパティ（セッター）

| プロパティ名 | 型 | アクセス | 既定値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| `cameraSpeed` | `number` | 書き込み専用 | `5` | フライスルー操作時（`WASDQE` キー）の移動速度を設定します。 |
| `rotateSpeed` | `number` | 書き込み専用 | `1.5` | 矢印キー操作時の回転速度を設定します。 |

（注: マウス右ドラッグ時の視点操作感度 `_mouseSensitivity` は内部で `0.003` に固定されています。）

---

## 5. メソッド

### `setDamping(factor?: number): void`
`OrbitControls` のダンピング（慣性）を有効にし、ダンピング係数を設定します。`OrbitControls` が管理する操作に適用され、キーボード操作や右ドラッグによるカメラの直接変更には適用されません。

* **パラメーター:**
  * `factor`（省略可能、既定値: `0.5`）: `OrbitControls.dampingFactor` に設定する慣性係数です。値が小さいほど、より滑らかに長く減速します。
* **戻り値:** `void`

---

### `disableDamping(): void`
カメラのダンピング（慣性）を無効にします。

* **パラメーター:** なし
* **戻り値:** `void`

---

### `update(delta: number): void`
コントローラーの状態を更新します。アニメーションループ内で毎フレーム呼び出してください。

* **パラメーター:** `delta` は前のフレームからの経過秒数で、フレームレートに依存しない移動と回転の計算に使われます。
* **戻り値:** `void`

---

### `dispose(): void`
登録済みのポインター、コンテキストメニュー、キーボード、フォーカス喪失の各リスナーに対して `removeEventListener` を呼び出します。`pointerdown` リスナーはキャプチャ有効で登録されますが、解除時にはそのオプションを指定しないため、ブラウザーはこのリスナーを削除しません。繰り返し作成と破棄を行うと、このハンドラーが `dom` に残る場合があります。

* **パラメーター:** なし
* **戻り値:** `void`

---

## 6. 使用例

```typescript
import { SceneController } from "./SceneController";
import StudioControls from "./controls/StudioControls";
import ThreeWorld from "./ThreeWorld";

class ControlledScene extends SceneController {
  public start(): void {
    // シーンのオブジェクトをここで初期化します。
  }

  public update(_delta: number): void {
    if (this.isKeyPressed("Space")) {
      // 押されたキーを処理します。
    }
  }

  public override delete(): void {
    // シーンが所有するリソースを解放します。
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.setControls((camera, domElement) => {
  const controls = new StudioControls(camera, domElement);
  controls.cameraSpeed = 8;
  controls.rotateSpeed = 2.0;
  controls.setDamping(0.1);
  return controls;
});

window.addEventListener("resize", () => {
  world.resize(window.innerWidth, window.innerHeight);
});

world.addScene("controlled", new ControlledScene());
await world.start("controlled");

// 終了時:
world.controls?.dispose();
world.delete();
```
