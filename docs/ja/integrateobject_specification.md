# `IntegrateObject` クラス インターフェース仕様

## 1. 概要
`IntegrateObject` はThree.jsの `Mesh` と任意の `PhysicsBodyHandle` をまとめて保持します。両者のライフサイクルをまとめて扱えますが、メッシュをシーンに追加したり、物理ボディを自動作成したりはしません。

* **依存関係:** `three`、`PhysicsBodyHandle`
* **エクスポート形式:** `export default class IntegrateObject`。`src/s-three-extensions/index.ts` から `IntegrateObject` として再エクスポートされます。

---

## 2. コンストラクター

### `constructor(mesh: (() => THREE.Mesh) | THREE.Mesh | null = null)`
任意のメッシュを指定して `IntegrateObject` を作成します。ファクトリー関数を指定した場合は、その関数を直ちに呼び出し、返されたメッシュを保持します。

---

## 3. プロパティ（ゲッター）

| プロパティ名 | 型 | アクセス | 説明 |
| :--- | :--- | :--- | :--- |
| `mesh` | `THREE.Mesh \| null` | 読み取り専用 | 管理対象のメッシュです。未設定または破棄後は `null` です。 |
| `physicsBodyHandle` | `PhysicsBodyHandle \| null` | 読み取り専用 | 管理対象の物理ボディハンドルです。未設定または破棄後は `null` です。 |

---

## 4. メソッド

### `setMesh(func: () => THREE.Mesh): void`
`func` を直ちに呼び出し、返されたメッシュを保存します。Three.jsシーンへの追加は行わず、以前に保存されていたメッシュや物理ボディも破棄しません。物理ボディハンドルが設定済みの状態でメッシュを差し替えた場合、そのハンドルは元のメッシュに関連付いたままです。

### `setPhysicalBody(func: (mesh: THREE.Mesh) => PhysicsBodyHandle): void`
保存されているメッシュを `func` に渡し、返されたハンドルを保存します。メッシュが未設定の場合は `Error` をスローします。コールバック内で `physicsWorld.addBody(mesh, options)` などを呼び出して物理ボディを作成できます。このメソッドを再度呼び出すと保存済みハンドルは置き換わりますが、以前のハンドルは破棄されません。必要に応じて個別に破棄してください。

### `dispose(isDelete: boolean = false): void`
保存されている物理ボディハンドルがあれば破棄し、2つの参照をクリアします。`isDelete` が `true` の場合は、メッシュのジオメトリとマテリアル（配列の場合は各マテリアル）も破棄します。メッシュを親オブジェクトやシーンから削除することはありません。必要に応じて、破棄前に別途シーンからメッシュを取り除いてください。

---

## 5. 使用例

```typescript
import * as THREE from "three";
import { IntegrateObject, PhysicsWorld } from "./src/s-three-extensions";

const physicsWorld = await PhysicsWorld.create();
const object = new IntegrateObject(() => {
    const geometry = new THREE.SphereGeometry(1);
    const material = new THREE.MeshNormalMaterial();
    return new THREE.Mesh(geometry, material);
});

scene.add(object.mesh!);
object.setPhysicalBody((mesh) =>
    physicsWorld.addBody(mesh, {
        type: "dynamic",
        colliders: [{ shape: { type: "autoSphere" } }],
    }),
);

function update(delta: number): void {
    physicsWorld.step(delta);
}

// 終了時:
scene.remove(object.mesh!);
object.dispose(true);
physicsWorld.dispose();
```