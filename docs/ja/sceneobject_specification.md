# `SceneObject` クラス インターフェース仕様

## 1. 概要
`SceneObject` はThree.jsの `Mesh` と任意の `PhysicsBodyHandle`、任意の `tag`、および毎フレーム実行される更新コールバックをまとめて管理します。`SceneController.addSceneObject()` でシーンに登録すると、毎フレーム `update(delta)` が自動的に呼び出されます。

* **依存関係:** `three`、`PhysicsBodyHandle`、`ExtensionUtils`（`disposeMesh`）
* **エクスポート形式:** `export default class SceneObject`。`src/s-three-extensions/index.ts` から `SceneObject` として再エクスポートされます。

---

## 2. コンストラクター

### `constructor(mesh: (() => THREE.Mesh) | THREE.Mesh | null = null)`
任意のメッシュを指定して `SceneObject` を作成します。ファクトリー関数を指定した場合は、その関数を直ちに呼び出し、返されたメッシュを保持します。

---

## 3. プロパティ

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `meshName` | `string \| null` | 読み書き可能 | メッシュが設定されている場合に `mesh.name` を取得または設定します（メッシュ未設定時は `null`。セッターは `string` を受け取り、`mesh` が `null` の場合は何もしません）。 |
| `tag` | `string \| null` | 読み書き可能 | このオブジェクトを識別するための任意の文字列タグです（初期値は `null`。セッターは `string` を受け取ります）。 |
| `mesh` | `THREE.Mesh \| null` | 読み取り専用 | 管理対象のメッシュです。未設定または破棄後は `null` です。 |
| `physicsBodyHandle` | `PhysicsBodyHandle \| null` | 読み取り専用 | 管理対象の物理ボディハンドルです。未設定または破棄後は `null` です。 |

---

## 4. メソッド

### `setMesh(func: () => THREE.Mesh): void`
`func` を直ちに呼び出し、返されたメッシュを保存します。Three.jsシーンへの追加は行わず、以前に保存されていたメッシュや物理ボディも破棄しません。

### `setPhysicalBody(func: (mesh: THREE.Mesh) => PhysicsBodyHandle): void`
保存されているメッシュを `func` に渡し、返されたハンドルを保存します。メッシュが未設定の場合は `Error`（`"A mesh must be added before adding a physical body."`）をスローします。このメソッドを再度呼び出すと保存済みハンドルは置き換わりますが、以前のハンドルは破棄されません。必要に応じて個別に破棄してください。

### `setPhysicsMesh(meshFunc: () => THREE.Mesh, physicsFunc: (mesh: THREE.Mesh) => PhysicsBodyHandle): void`
`meshFunc()` を呼び出してメッシュを作成・保存し、直ちにそのメッシュを `physicsFunc(mesh)` に渡して返された `PhysicsBodyHandle` を保存するコンビニエンスメソッドです。

### `addUpdateFunction(func: (delta: number, mesh: THREE.Mesh, bodyHandle: PhysicsBodyHandle | null) => void): void`
このオブジェクトの毎フレーム更新コールバックを登録します。現在メッシュが設定されていない場合は何もしません。

### `update(delta: number): void`（`@local`）
更新コールバックとメッシュの両方が設定されている場合、`(delta, mesh, physicsBodyHandle)` を引数としてコールバックを呼び出します。通常は `SceneController.animate()` から自動的に呼ばれます。

### `dispose(deleteMeshMaterial: boolean = false): void`
`physicsBodyHandle` が存在する場合は `physicsBodyHandle.dispose()` を呼び出して `PhysicsWorld` から剛体とコライダーを削除し、次に `disposeMesh(this._mesh, deleteMeshMaterial)` を呼び出します（親からの削除、利用可能であれば `mesh.dispose()` の呼び出し、`deleteMeshMaterial` が `true` の場合はジオメトリおよびマテリアルの破棄を行います）。その後、`_mesh`、`_physicsBodyHandle`、`_updateFunction` の参照を `null` にクリアします。

---

## 5. 使用例

```typescript
import * as THREE from "three";
import {
    SceneController,
    SceneObject,
    StudioControls,
} from "./src/s-three-extensions";

export class PhysicsDemoScene extends SceneController {
    private sphere: SceneObject | null = null;

    public async start(): Promise<void> {
        await this.initPhysics();
        this.controller = new StudioControls(this.camera, this.domElement);

        this.sphere = new SceneObject();
        this.sphere.setPhysicsMesh(
            () => {
                const geometry = new THREE.SphereGeometry(1, 32, 32);
                const material = new THREE.MeshNormalMaterial();
                return new THREE.Mesh(geometry, material);
            },
            (mesh) =>
                this.physicsWorld!.addBody(mesh, {
                    type: "dynamic",
                    colliders: [{ shape: { type: "autoSphere" }, restitution: 0.5 }],
                }),
        );

        this.sphere.addUpdateFunction((_delta, mesh) => {
            // メッシュや bodyHandle に対する毎フレームの独自処理
            if (mesh.position.y < -10) {
                mesh.position.set(0, 5, 0);
            }
        });

        this.addSceneObject(this.sphere);
    }

    public update(_delta: number): void {}

    public override delete(): void {
        this.removeAllSceneObjects();
        this.sphere?.dispose(true);
    }
}
```
