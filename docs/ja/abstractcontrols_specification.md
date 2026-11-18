# `AbstractControls` クラス インターフェース仕様

## 1. 概要
`AbstractControls` は、カメラコントロール向けに公開されている抽象基底クラスです。Three.js の `OrbitControls` インスタンスと押下中のキーコードを管理し、`StudioControls` などの派生クラスに共通の更新・破棄メソッドを提供します。

* **依存関係:** `three`、`three/addons/controls/OrbitControls.js`
* **エクスポート形式:** デフォルトエクスポート。`src/s-three-extensions/index.ts` から `AbstractControls` として再エクスポートされます。

このクラスを直接インスタンス化することはできません。派生クラスはキーボード更新処理とポインターハンドラーを実装し、マウスボタンのモードを設定したうえで、ハンドラーの初期化後に `setupEvents()` を呼び出す必要があります。

---

## 2. コンストラクター

### `constructor(camera: THREE.Camera, dom: HTMLElement)`
`OrbitControls` インスタンスを作成して初期モードを設定し、カメラのワールド座標上で前方1単位の位置にターゲットを設定します。

* **パラメーター:** `camera` は操作対象のカメラ、`dom` は `OrbitControls` が使用する要素です。

---

## 3. メソッド

### `getKeyState(key: string): boolean`
指定した `KeyboardEvent.code` が押されているかを返します。イベント対象が `INPUT` または `TEXTAREA` の場合、`keydown` の入力は無視されます。ウィンドウがフォーカスを失ったとき、および `flash()` の呼び出し時にキー状態がクリアされます。

### `flash(): void`
追跡中のキー状態をクリアし、`OrbitControls` のマウスボタン割り当てを派生クラスの既定モードに戻します。

### `update(delta: number): void`
派生クラスの `keyEvent(delta)` フックを呼び出し、基底クラスが保持する `OrbitControls` を更新します。アプリケーションまたは所有する `ThreeWorld` が毎フレーム呼び出す必要があります。

### `dispose(): void`
`setupEvents()` が登録したイベントリスナーを削除します。`pointerdown` リスナーはキャプチャ有効で登録されますが、解除時にはキャプチャオプションを指定しないため、残る場合があります。このメソッドは `OrbitControls.dispose()` を呼び出しません。

---

## 4. 派生クラスのフック

| フック | 説明 |
| :--- | :--- |
| `defaultMode(): MouseButtons` | `OrbitControls.mouseButtons` の既定割り当てを返します。初期化時と `flash()` の呼び出し時に使われます。 |
| `setupControlOptions(): void` | 初期マウスボタン割り当てとオービットターゲットを設定します。 |
| `setupEvents(): void` | 派生クラスのポインターハンドラーと、共通のキーボード・フォーカス喪失・コンテキストメニューハンドラーを登録します。 |
| `keyEvent(delta: number): void` | フレームごとのキーボード動作を実装する抽象フックです。 |
| `handleMouseDown(e: PointerEvent): void` | 抽象ポインターダウンハンドラーです。 |
| `handleMouseMove(e: PointerEvent): void` | 抽象ポインター移動ハンドラーです。 |
| `handleMouseUp(e: PointerEvent): void` | 抽象ポインターアップハンドラーです。 |

派生クラスは保護プロパティ `mouseButtons` を使って、基底クラスの `OrbitControls.mouseButtons` 割り当てを変更できます。

---

## 5. 使用方法

具象実装の `StudioControls` を `ThreeWorld.setControls()` に渡すと、ワールドが毎フレーム更新し、キー状態を `SceneController.isKeyPressed()` から利用できます。使用例は [StudioControls](./studiocontrols_specification.md) を参照してください。
