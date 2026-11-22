# `AbstractControls` クラス インターフェース仕様

## 1. 概要
`AbstractControls` はカメラコントロール用のエクスポートされた抽象基底クラスです。Three.jsの `OrbitControls` インスタンスを所有し、押下中のキーボードコードを追跡し、任意のポインターイベントコールバックを転送し、`BasicControls` や `StudioControls` などのサブクラス向けに共通の更新・破棄メソッドを提供します。

* **依存関係:** `three`、`three/addons/controls/OrbitControls.js`
* **エクスポート形式:** デフォルトエクスポート（`export default abstract class AbstractControls`）。`src/s-three-extensions/index.ts` から `AbstractControls` として再エクスポートされます。`AbstractControls.ts` からは `MouseButtons` 型もエクスポートされます。

このクラスは直接インスタンス化しません。サブクラスでは `keyEvent(delta: number)` を実装し、ハンドラーの初期化後に `setupEvents()` を呼び出す必要があります。

---

## 2. エクスポート型

### `MouseButtons`
```typescript
export type MouseButtons = {
    LEFT: THREE.MOUSE | null;
    MIDDLE: THREE.MOUSE | null;
    RIGHT: THREE.MOUSE | null;
};
```

---

## 3. コンストラクター

### `constructor(camera: THREE.Camera, dom: HTMLElement)`
`OrbitControls` インスタンスを作成し、`setupControlOptions()` によって初期モードを設定し、カメラ前方のワールド空間上1単位の位置にターゲットを設定します。

* **パラメーター:** `camera` は制御対象のカメラ、`dom` は `OrbitControls` が使用する要素です。

---

## 4. プロパティ（セッター）

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `cameraSpeed` | `number` | 書き込み専用 | フライトスルー移動の速度を設定します（既定値: `5`）。 |
| `rotateSpeed` | `number` | 書き込み専用 | 矢印キーによる視点回転の速度を設定します（既定値: `1.5`）。 |
| `mouseDownEvent` | `(e: PointerEvent) => void` | 書き込み専用 | `dom` 上での `pointerdown` 時に呼ばれる任意のコールバックです。 |
| `mouseMoveEvent` | `(e: PointerEvent) => void` | 書き込み専用 | `dom` 上での `pointermove` 時に呼ばれる任意のコールバックです。 |
| `mouseUpEvent` | `(e: PointerEvent) => void` | 書き込み専用 | `window` 上での `pointerup` 時に呼ばれる任意のコールバックです。 |

---

## 5. メソッド

### `getKeyState(key: string): boolean`
指定した `KeyboardEvent.code` が現在押されているかを返します。イベントターゲットが `INPUT` または `TEXTAREA` の場合、`keydown` 時のキーボード入力は無視されます。`Alt` キーのブラウザー既定動作は `keydown` と `keyup` で抑止されます。キー状態はウィンドウの `blur` 時および `flush()` 呼び出し時にクリアされます。

### `setDamping(factor: number = 0.5): void`
`OrbitControls` のダンピングを有効にし（`enableDamping = true`）、`dampingFactor` を設定します。

### `disableDamping(): void`
`OrbitControls` のダンピングを無効にします（`enableDamping = false`）。

### `flush(): void`
追跡中のキー状態をクリアし、`OrbitControls` のマウスボタン割り当てをサブクラスの `defaultMode()` に戻します。

### `update(delta: number): void`
サブクラスの `keyEvent(delta)` フックを呼び出し、内部の `OrbitControls` を更新します。アプリケーションまたは所有元の `SceneController` が毎フレーム呼び出す必要があります。

### `dispose(): void`
`setupEvents()` で登録したイベントリスナー（`{ capture: true }` の `pointerdown` リスナーを含む）を削除し、内部の `OrbitControls` を破棄（`dispose()`）し、`mouseDownEvent`、`mouseMoveEvent`、`mouseUpEvent` の参照を `null` にクリアします。

---

## 6. サブクラスフック

| フック | 説明 |
| :--- | :--- |
| `defaultMode(): MouseButtons` | 既定の `OrbitControls.mouseButtons` 割り当てを返します。初期化時と `flush()` 実行時に使用されます。 |
| `setupControlOptions(): void` | マウス割り当てとオービットターゲットの初期設定を行います。 |
| `setupEvents(): void` | ポインター（`dom` 上の `pointerdown` capture、`pointermove`、`contextmenu`、`window` 上の `pointerup`）、キーボード、および `blur` ハンドラーを登録します。 |
| `cameraMove(direction, moveSpeed): void` | カメラと `OrbitControls.target` を `"FORWARD"`、`"RIGHT"`、または `"UP"` 方向へ移動します。 |
| `cameraRotate(yawDelta, pitchDelta): void` | カメラのヨーおよびピッチ（$\pm(\frac{\pi}{2} - 0.01)\text{ rad}$ に制限）を回転し、`OrbitControls.target` を更新します。 |
| `handleFlyThroughKeys(delta): void` | `cameraSpeed` と `rotateSpeed` を用いて `WASDQE` 移動と矢印キー回転を処理します。 |
| `keyEvent(delta: number): void` | 毎フレームのキーボード処理用抽象フックです。 |
| `handleMouseDown(e: PointerEvent): void` | ポインター押下ハンドラーです。`mouseDownEvent` が設定されていれば呼び出します（サブクラスでオーバーライド可能）。 |
| `handleMouseMove(e: PointerEvent): void` | ポインター移動ハンドラーです。`mouseMoveEvent` が設定されていれば呼び出します（サブクラスでオーバーライド可能）。 |
| `handleMouseUp(e: PointerEvent): void` | ポインター解放ハンドラーです。`mouseUpEvent` が設定されていれば呼び出します（サブクラスでオーバーライド可能）。 |

サブクラスは保護された `mouseButtons` プロパティを設定して、内部の `OrbitControls.mouseButtons` 割り当てを変更することもできます。

---

## 7. 使用方法

具象実装（`StudioControls` または `BasicControls`）を `SceneController.controller` に代入すると、シーンが毎フレーム自動的に更新し、`SceneController.isKeyPressed()` からキー状態を読み取れるようになります。完全な使用例は [StudioControls](./studiocontrols_specification.md) および [BasicControls](./basiccontrols_specification.md) を参照してください。
