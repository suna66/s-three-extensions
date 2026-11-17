# `SceneController` クラス インターフェース仕様

## 1. 概要
`SceneController` は `ThreeWorld` が管理するシーンの抽象基底クラスです。`THREE.Scene` を所有し、関連付けられた `ThreeWorld` のカメラとキャンバスへのアクセスを提供するとともに、シーンのライフサイクルフックを定義します。

* **依存関係:** `three/webgpu`、`ThreeWorld`
* **エクスポート形式:** `export class SceneController`（名前付きエクスポート）

---

## 2. ライフサイクル

1. 派生クラスをインスタンス化します。基底クラスのコンストラクターが空の `THREE.Scene` を作成します。
2. `ThreeWorld.addScene(key, controller)` がコントローラーをキーに関連付け、`controller.init(world)` を呼び出します。
3. `ThreeWorld.start(key)` がレンダラーを初期化し、選択されたコントローラーの `start()` を呼び出して、描画ループを開始します。
4. コントローラーは保護メソッド `loadScene(key, isDelete)` でシーン遷移を要求できます。遷移先コントローラーは直ちに再開されます。次のアニメーションフレームで、遷移元コントローラーは削除されるか、停止して一時停止状態になり、その後に遷移先がアクティブになります。遷移時には押下中のキーセットがクリアされます。
5. 描画フレームごとに `ThreeWorld` はアクティブなコントローラーの `update(delta)` を呼び出してから、その `scene` を描画します。`delta` は前回のフレームからの経過秒数です。
6. `ThreeWorld.delete()` はアクティブなコントローラーの `delete()` を呼び出します。

`camera` と `domElement` のゲッターを使うには、先に `init(world)` が呼び出されている必要があります。初期化前にアクセスすると、`null` のワールドを参照するため失敗します。

---

## 3. プロパティ（ゲッター）

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `scene` | `THREE.Scene` | 読み取り専用 | このコントローラーが所有するシーン |
| `camera` | `THREE.Camera` | 読み取り専用 | 初期化済みの `ThreeWorld` が持つカメラ |
| `domElement` | `HTMLCanvasElement` | 読み取り専用 | 初期化済みの `ThreeWorld` が持つレンダラーキャンバス |

---

## 4. メソッド

### `constructor()`
空の `THREE.Scene` を作成します。派生クラスは暗黙の基底コンストラクターを使うか、独自のコンストラクター内で `super()` を呼び出せます。

---

### `init(world: ThreeWorld): void`
このコントローラーに関連付ける `ThreeWorld` インスタンスを保存します。通常は `ThreeWorld.addScene()` が呼び出します。この流れの外でコントローラーを管理する場合は、`camera` または `domElement` にアクセスする前に呼び出してください。

* **パラメーター:** `world` はこのコントローラーを所有する `ThreeWorld` インスタンスです。
* **戻り値:** `void`

---

### `abstract start(): void`
コントローラーの初回開始時に呼び出されます。初期シーンのオブジェクトを作成して追加する処理を実装します。一時停止後の再開時には、`start()` の代わりに `restart()` が呼び出されます。

* **戻り値:** `void`

---

### `abstract update(delta: number): void`
`ThreeWorld` の描画ループが動作し、このコントローラーがアクティブな間、各描画の前に呼び出されます。

* **パラメーター:** `delta` は前のフレームからの経過秒数です。
* **戻り値:** `void`

---

### `delete(): void`
シーン遷移でコントローラーが削除されるとき、またはアクティブな状態で `ThreeWorld.delete()` が呼び出されたときに実行される任意のクリーンアップフックです。基底クラスの実装は何もしません。派生クラスでリソースを解放する処理をオーバーライドできます。

* **戻り値:** `void`

---

### `stop(): void` と `restart(): void`
任意のライフサイクルフックです。別のシーンへ切り替えるときに `stop()` が呼び出され、一時停止済みのコントローラーを再開するときに `restart()` が呼び出されます。基底クラスの実装は何もしません。

### `protected loadScene(key: string, isDelete: boolean = true): void`
関連付けられた `ThreeWorld` を通じて、`key` に登録されたコントローラーへの遷移を要求します。`isDelete` が `true` の場合、遷移元のコントローラーは削除され、ワールドのシーンレジストリからも取り除かれます。`false` の場合は一時停止され、後で再開できます。このコントローラーがワールドで初期化されていない場合は何もしません。

* **パラメーター:** `key` は遷移先のシーンキーです。`isDelete` は遷移元を削除するか、一時停止するかを選択します。
* **戻り値:** `void`

---

### `protected isKeyPressed(key: string): boolean`
関連付けられた `ThreeWorld` で、指定した `KeyboardEvent.code`（例: `"KeyW"`）が押されているかを確認します。コントローラーがワールドで初期化されていない場合は `false` を返します。

* **パラメーター:** `key` は文字そのものではなく、キーボードコードです。
* **戻り値:** `boolean`

---

### `protected addMesh(mesh: THREE.Mesh): void`
メッシュをこのコントローラーのシーンに直接追加します。

* **パラメーター:** `mesh` は追加するメッシュです。
* **戻り値:** `void`

---

### `protected removeMesh(mesh: THREE.Mesh): void`
メッシュをこのコントローラーのシーンから直接削除します。メッシュのジオメトリ、マテリアル、テクスチャ、子オブジェクトは破棄しません。所有するリソースは別途破棄してください。メッシュと任意の物理ボディをまとめて管理するには `IntegrateObject` を使用できます。

* **パラメーター:**
  * `mesh`: 削除するメッシュです。
* **戻り値:** `void`

---

## 5. 使用例

```typescript
import * as THREE from "three/webgpu";
import { SceneController } from "./SceneController";

export class SampleScene extends SceneController {
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
        if (this.cube) {
            this.removeMesh(this.cube);
            this.cube.geometry.dispose();
            const materials = Array.isArray(this.cube.material)
                ? this.cube.material
                : [this.cube.material];
            materials.forEach((material) => material.dispose());
        }
    }
}
```
