# `SceneController` クラス インターフェース仕様

## 1. 概要
`SceneController` は `ThreeWorld` によって管理されるシーンの抽象基底クラスです。`THREE.Scene` を所有し、`SceneObject` インスタンス、ライト、任意の `AbstractControls`、および任意の `PhysicsWorld`（デバッグ描画や衝突イベント転送を含む）を管理し、シーンのライフサイクルフックを定義します。

* **依存関係:** `three/webgpu`、`ThreeWorld`、`SceneObject`、`PhysicsWorld`、`AbstractControls`、`PhysicsTypes`
* **エクスポート形式:** `export abstract class SceneController`（名前付きエクスポート）

---

## 2. ライフサイクル

1. サブクラスをインスタンス化します。基底コンストラクターが空の `THREE.Scene` を作成します。
2. `ThreeWorld.addScene(key, controller)` によりコントローラーがキーと関連付けられ、`controller.init(world)` が呼ばれます。
3. `ThreeWorld.start(key)` がレンダラーを初期化し、選択されたコントローラーの `start()` を呼び出してレンダーループを開始します（`start()` 内で `await this.initPhysics()` や `this.controller` の設定を行えます）。
4. コントローラーは保護された `loadScene(key, isDelete)` メソッドでシーン遷移を要求できます。遷移先コントローラーは直ちに再開（`resume()`）され、次のアニメーションフレームで遷移元コントローラーが削除（`delete()` + `dispose()`）およびレジストリからの除去、または停止・一時停止（`suspend()`）された後、遷移先がアクティブになります。
5. 毎フレームの描画前に、`ThreeWorld` はアクティブなコントローラーの `animate(delta)` を呼び出します。`animate(delta)` は物理ステップ、`controller` の更新、登録された全 `SceneObject` の更新、有効時の物理デバッグワイヤーフレーム更新、および `update(delta)` を順に実行します。
6. `ThreeWorld.delete()` はアクティブなコントローラーの `delete()` を呼び出します。

`camera` および `domElement` ゲッターは `init(space)` が実行された後でのみ使用できます。初期化前にアクセスすると `null` 参照により失敗します。

---

## 3. プロパティ

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `scene` | `THREE.Scene` | 読み取り専用 | このコントローラーが所有するシーンです。 |
| `camera` | `THREE.Camera` | 読み取り専用 | 初期化済み `ThreeWorld` のカメラです。 |
| `domElement` | `HTMLCanvasElement` | 読み取り専用 | 初期化済み `ThreeWorld` のレンダラーキャンバスです。 |
| `controller` | `AbstractControls \| null` | 読み書き可能 | このシーンで使用するカメラコントロールのインスタンスです。 |
| `physicsWorld` | `PhysicsWorld \| null` | 読み取り専用 | `initPhysics()` で作成された `PhysicsWorld` です。未初期化の場合は `null` です。 |
| `physicsDebug` | `boolean` | 読み書き可能 | `scene` 内でのRapier物理デバッグワイヤーフレーム（`THREE.LineSegments`）表示を有効または無効にします。 |
| `enablePhysicsActiveEvent` | `boolean` | 書き込み専用 | `physicsWorld` 初期化済みの場合に `physicsWorld.onCollision()` へ `physicsActiveEvent` を登録または解除します。 |
| `suspended` | `boolean` | 読み取り専用（`@internal`） | コントローラーが現在一時停止中かどうかを返します。 |

---

## 4. メソッド

### `constructor()`
空の `THREE.Scene` を作成します。サブクラスは暗黙の基底コンストラクターを使うか、独自のコンストラクターから `super()` を呼び出します。

---

### `init(space: ThreeWorld): void`
このコントローラーに関連付ける `ThreeWorld` インスタンスを保存し、内部状態（`_suspended`、`_physicsWorld`、`_isDebug`、`_sceneObjects`）を初期化します。`ThreeWorld.addScene()` から呼ばれます。その流れ以外で管理する場合は、`camera` や `domElement` にアクセスする前に呼び出してください。

* **パラメーター:** `space` は所有元の `ThreeWorld` インスタンスです。
* **戻り値:** `void`

---

### `async initPhysics(): Promise<void>`
`PhysicsWorld.create()` を通じて `_physicsWorld` を作成・初期化します。物理ボディの追加や `enablePhysicsActiveEvent` の有効化を行う前に `start()` 内で呼び出してください。

* **戻り値:** `Promise<void>`

---

### `abstract start(): void`
コントローラーが最初に開始されるとき、または一時停止していない状態から再開されるときに呼ばれます。シーンの初期オブジェクト、ライト、コントロール、物理ワールドを作成する処理を実装してください。一時停止後の再開時には代わりに `restart()` が呼ばれます。

* **戻り値:** `void`

---

### `abstract update(delta: number): void`
`animate(delta)` 内で物理ステップ、カメラコントロール更新、`SceneObject` 更新、物理デバッグ描画の後に毎フレーム呼ばれます。

* **パラメーター:** `delta` は前フレームからの経過時間（秒、および `ThreeWorld` により最大 `0.1` 秒にクランプ）です。
* **戻り値:** `void`

---

### `stop(): void` および `restart(): void`
任意のライフサイクルフックです。`stop()` は `isDelete = false` で別シーンへ切り替わる際に呼ばれます。`restart()` は一時停止されていたコントローラーが再開される際に呼ばれます。基底実装は何も行いません。

---

### `delete(): void`
シーン遷移でコントローラーが削除されるとき、またはアクティブな状態で `ThreeWorld.delete()` が呼ばれたときに実行される任意のクリーンアップフックです。基底実装は何も行いません。サブクラスでオーバーライドし、`removeAllMesh()`、`removeAllLight()`、各オブジェクトの `dispose()` などのリソース解放を行えます。

* **戻り値:** `void`

---

### `collision(_event: CollisionEventPayload): void`
`enablePhysicsActiveEvent` が `true` で `physicsWorld` から衝突イベントが発火されたときに呼ばれる任意のコールバックです。基底実装は何も行いません。サブクラスでオーバーライドまたは代入して使用します。

* **パラメーター:** `_event` は `PhysicsWorld` からの `CollisionEventPayload` です。
* **戻り値:** `void`

---

### `animate(delta: number): void`
`ThreeWorld` から毎フレーム呼ばれる実行パイプラインです：
1. `_physicsWorld` が存在する場合、`this._physicsWorld.step(delta)` を呼び出します。
2. `_controller` が存在する場合、`this._controller.update(delta)` を呼び出します。
3. `_sceneObjects` 内の各 `SceneObject` の `obj.update(delta)` を呼び出します（`_sceneObjects` が `null` の場合は早期リターンします）。
4. `physicsDebug` と `_physicsWorld` が有効な場合、`this._physicsWorld.debugRenderer` からデバッグワイヤーフレームの `position` および `color` 属性を更新します。
5. `this.update(delta)` を呼び出します。

---

### `suspend(): void`、`resume(): void`、`dispose(): void`（`@internal`）
`ThreeWorld` から呼び出される内部ライフサイクルメソッドです：
* `suspend()`: `stop()` を呼び出し、`suspended` を `true` に設定します。
* `resume()`: `suspended` が `true` の場合は `restart()`、そうでなければ `start()` を呼び出し、`suspended` を `false` に設定します。
* `dispose()`: `_sceneObjects` をクリアし、`_physicsWorld` と `_controller` があれば `dispose()` を呼び出し、`_physicsEventDispose` の購読を解除し、`physicsDebug` を無効にします。

---

### `protected loadScene(key: string, isDelete: boolean = true): void`
関連付けられた `ThreeWorld` を通じて、`key` に登録されたコントローラーへの遷移を要求します。`isDelete` が `true` の場合、遷移元コントローラーは削除・破棄され、ワールドのシーンレジストリからも取り除かれます。`false` の場合は一時停止され、後で再開できます。ワールドで初期化されていない場合は何もしません。

---

### `protected addScene(key: string, scene: SceneController): void`
関連付けられた `ThreeWorld` に別の `SceneController` を `key` で登録します。ワールドで初期化されていない場合は何もしません。

---

### `protected isKeyPressed(key: string): boolean`
指定された `KeyboardEvent.code`（例: `"KeyW"`、`"Space"`）が `this.controller` で現在押下中かどうかを返します。`controller` が `null` の場合は `false` を返します。

---

### `protected addMesh(mesh: SceneObject): void`
`SceneObject` を `_sceneObjects` に登録し、`mesh.mesh` が `null` でなければ `this.scene` に追加します。

---

### `protected removeMesh(mesh: SceneObject): void`
`mesh.mesh` を `this.scene` から削除し（`null` でない場合）、`mesh` を `_sceneObjects` から取り除きます。ジオメトリ、マテリアル、テクスチャの破棄は行わないため、必要に応じて `mesh.dispose(...)` を別途呼び出してください。

---

### `protected removeAllMesh(): void`
`_sceneObjects` に登録されているすべての `SceneObject` に対して `removeMesh()` を呼び出します。

---

### `protected addLight(light: THREE.Light): void`
`light` を内部リストに記録し、`this.scene` に追加します。

---

### `protected removeLight(light: THREE.Light): void`
`light` を内部リストおよび `this.scene` から削除します。

---

### `protected removeAllLight(): void`
記録されているすべてのライトに対して `removeLight()` を呼び出します。

---

## 5. 使用例

```typescript
import * as THREE from "three";
import {
    SceneController,
    SceneObject,
    StudioControls,
} from "./src/s-three-extensions";

export class SampleScene extends SceneController {
    private cube: SceneObject | null = null;

    public start(): void {
        this.controller = new StudioControls(this.camera, this.domElement);
        this.cube = new SceneObject(() => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            return new THREE.Mesh(geometry, material);
        });
        this.addMesh(this.cube);
    }

    public update(delta: number): void {
        if (!this.cube?.mesh) return;
        this.cube.mesh.rotation.x += delta;
        this.cube.mesh.rotation.y += delta;
    }

    public override delete(): void {
        this.removeAllMesh();
        this.cube?.dispose(true);
    }
}
```
