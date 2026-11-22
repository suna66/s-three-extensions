# `BasicControls` クラス インターフェース仕様

## 1. 概要
`BasicControls` は `AbstractControls` を継承した軽量なキーボード駆動のカメラコントローラーです。`StudioControls` とは異なり、既定で `OrbitControls` のマウスボタン操作を無効化し、修飾キーなしで常時 WASDQE 移動および矢印キーによる視点回転を行います。

* **依存関係:** `three`、`AbstractControls`
* **エクスポート形式:** `export default class BasicControls`。`src/s-three-extensions/index.ts` から `BasicControls` として再エクスポートされます。

---

## 2. 操作モードとキー割り当て

### マウスボタン割り当て（`defaultMode`）
`OrbitControls.mouseButtons` のすべてのスロット（`LEFT`、`MIDDLE`、`RIGHT`）は `null` に設定されます。なお、`AbstractControls` に登録された `mouseDownEvent`、`mouseMoveEvent`、`mouseUpEvent` コールバックはポインターイベント時に引き続き呼び出されます。

### キーボード操作
キーボード操作は常時有効です（`Alt` キー押下やマウスドラッグは不要です）。フォーカスが `INPUT` または `TEXTAREA` 要素にある場合は入力が無視されます（`AbstractControls` で処理）。

* **カメラ回転:**
  * `ArrowLeft` / `ArrowRight`: `rotateSpeed` の速度でヨー回転します。
  * `ArrowUp` / `ArrowDown`: `rotateSpeed` の速度でピッチ回転します（ピッチ角は $\pm(\frac{\pi}{2} - 0.01)\text{ rad}$ に制限されます）。
* **カメラ移動（並進）:**
  * `KeyW` / `KeyS`: カメラのワールド視線方向に沿って前後移動します。
  * `KeyA` / `KeyD`: 視線方向に直交する左右方向へ移動します。
  * `KeyQ` / `KeyE`: `camera.translateY` を用いてカメラのローカルY軸に沿って上下移動します。

---

## 3. コンストラクター

### `constructor(camera: THREE.Camera, dom: HTMLCanvasElement)`
`AbstractControls` を通じて `OrbitControls` を初期化し、すべてのマウスボタン割り当てを `null` に設定し、`OrbitControls.target` をカメラ前方1単位の位置に設定した上で、ポインター、キーボード、コンテキストメニュー、ウィンドウ `blur` の各イベントリスナーを登録します。

* **パラメーター:**
  * `camera` (`THREE.Camera`): 制御対象のThree.jsカメラインスタンスです。
  * `dom` (`HTMLCanvasElement`): リスナーを登録するキャンバス要素です（通常は `this.domElement`）。

---

## 4. プロパティ（セッター）

| プロパティ名 | 型 | アクセス | 既定値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| `cameraSpeed` | `number` | 書き込み専用 | `5` | `WASDQE` 移動時の移動速度を設定します。 |
| `rotateSpeed` | `number` | 書き込み専用 | `1.5` | 矢印キーによる回転速度を設定します。 |

---

## 5. メソッド

### `setDamping(factor?: number): void`
`OrbitControls` のダンピングを有効にし（`enableDamping = true`）、`dampingFactor` を設定します。

* **パラメーター:**
  * `factor` (`number`、省略可、既定値 `0.5`): ダンピング係数です。
* **戻り値:** `void`

### `disableDamping(): void`
`OrbitControls` のダンピングを無効にします（`enableDamping = false`）。

* **戻り値:** `void`

### `update(delta: number): void`、`getKeyState(key: string): boolean`、`flush(): void`、`dispose(): void`
`AbstractControls` から継承されています。`BasicControls` を `SceneController.controller` に設定すると、`SceneController.animate()` が毎フレーム自動的に `update(delta)` を呼び出します。

---

## 6. 使用例

```typescript
import {
    BasicControls,
    SceneController,
    ThreeWorld,
} from "./src/s-three-extensions";

class BasicControlledScene extends SceneController {
    public start(): void {
        const controls = new BasicControls(this.camera, this.domElement);
        controls.cameraSpeed = 8;
        controls.rotateSpeed = 2.0;
        this.controller = controls;
    }

    public update(_delta: number): void {
        if (this.isKeyPressed("Space")) {
            // Space キー押下時の処理
        }
    }
}

const canvas = document.querySelector<HTMLCanvasElement>("#app-canvas")!;
const world = new ThreeWorld(canvas, window.innerWidth, window.innerHeight);
world.addScene("basic", new BasicControlledScene());
await world.start("basic");
```
