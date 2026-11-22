# `PhysicsWorld` クラス インターフェース仕様

## 1. 概要
`PhysicsWorld` は `@dimforge/rapier3d-compat` をラップし、Rapierの剛体およびコライダーをThree.jsの `Object3D` インスタンスに結び付けます。アプリケーションの更新ループから `step(delta)` を呼び出すと、シミュレーションが進み、動的オブジェクトの変換が同期され、衝突イベントが通知されます。

* **依存関係:** `three`、`@dimforge/rapier3d-compat`
* **エクスポート形式:** `src/s-three-extensions/index.ts` から `PhysicsWorld`、`PhysicsBodyHandle`、`ColliderMeta` を名前付きエクスポート

---

## 2. 初期化と破棄

### `static async create(gravity?): Promise<PhysicsWorld>`
RapierのWebAssemblyモジュールを初期化してから、物理ワールドを作成します。コンストラクターは `private` のため、`PhysicsWorld` インスタンスの作成には必ずこのファクトリーを使用してください。

* **パラメーター:** `gravity` は省略可能な `{ x, y, z }` ベクトルです。既定値は `{ x: 0, y: -9.81, z: 0 }` です。
* **戻り値:** 初期化済みの `PhysicsWorld`

### `disposed: boolean`
`dispose()` が呼び出されたかどうかを示す読み取り専用フラグです。

### `debugRenderer: { vertices: Float32Array; colors: Float32Array }`
デバッグ可視化用に、Rapier の `world.debugRender()` から線分の頂点座標とRGBAカラーを返す読み取り専用ゲッターです。

### `dispose(): void`
イベントキューとRapierワールドを破棄し、オブジェクトのバインディング、コライダーメタデータ、衝突リスナーをクリアします。複数回呼び出しても結果は変わりません。不要になった時点で破棄し、その後は使用しないでください。

---

## 3. 剛体とコライダー

### `addBody(object: THREE.Object3D, options: RigidBodyOptions): PhysicsBodyHandle`
オブジェクトの現在のワールド座標上の位置と回転で剛体を作成し、指定されたコライダーをアタッチしてハンドルを返します。同じオブジェクトがすでに登録されている場合は、既存の剛体を先に削除します。親を持つオブジェクトにも対応し、シミュレーション結果はオブジェクトの親ローカルな位置と回転に変換されます。

### `addSensor(object, shape, options?): PhysicsBodyHandle`
センサーコライダーを1つ持つ固定剛体を作成します。`shape` は `ColliderShapeSpec` です。`options` には `tag`、`offset`、`friction`、`restitution` などのコライダー設定を指定できますが、`shape` と `isSensor` は指定できません。

### `attachCollider(object, rigidBody, options): RAPIER.Collider`
コライダーを作成し、衝突イベントで使用するオブジェクトと任意のタグを関連付けます。この低レベルAPIには、このワールドに属する剛体を渡してください。通常は `PhysicsBodyHandle.addCollider()` を使用してコライダーを追加します。

### `replaceColliders(object, rigidBody, specs): void`
剛体の既存コライダーをすべて削除し、`specs` に基づいて作り直します。ハンドルが設定を保持できるよう、ハンドル経由でコライダー設定を追加した後は `PhysicsBodyHandle.rebuildColliders()` の使用を推奨します。

### `removeObject(object: THREE.Object3D): void`
登録済みの剛体とコライダーを削除します。オブジェクトが登録されていない場合は何もしません。Three.jsシーンからオブジェクトを削除したり、ジオメトリやマテリアルを破棄したりはしません。

### `getPhysicsBodyHandle(obj: THREE.Object3D): PhysicsBodyHandle | null`
`obj` に対して登録されている `PhysicsBodyHandle` を返します。登録されていない場合は `null` を返します。

---

## 4. シミュレーションと衝突イベント

### `step(dt: number): void`
Rapierのタイムステップを `dt` に設定してシミュレーションを進め、動的剛体の位置と回転をバインドされたThree.jsオブジェクトに反映した後、キューにある衝突イベントを通知します。経過時間を秒単位で渡し、更新ごとに1回呼び出してください。このメソッドはキネマティック剛体からオブジェクトへの同期を行いません。キネマティック剛体へオブジェクトの変換を渡すには `PhysicsBodyHandle.syncFromObject()` を使用します。

### `onCollision(listener): () => void`
衝突の開始・終了イベントを受け取るリスナーを登録し、登録解除関数を返します。コールバックには `CollisionEventPayload` が渡されます。交差が始まったとき `started` は `true`、終了したときは `false` です。`selfObject` / `otherObject` とそれぞれの任意のタグが、イベント対象のコライダーペアを示します。

---

## 5. `PhysicsBodyHandle`
`addBody()` または `addSensor()` が返すハンドルです。バインドされたオブジェクトとRapier剛体にアクセスでき、作成時またはハンドル経由で追加されたコライダー設定を保持します。

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `object` | `THREE.Object3D` | 剛体にバインドされたThree.jsオブジェクト |
| `rigidBody` | `RAPIER.RigidBody` | 基になるRapier剛体 |

### `addCollider(options: ColliderOptions): RAPIER.Collider`
剛体にコライダーを追加し、後で再構築できるよう設定を保持します。

### `replaceColliders(colliders: ColliderOptions[]): void`
`PhysicsWorld.replaceColliders()` を通じて剛体のコライダーを `colliders` で置き換え、保持しているコライダー設定を `colliders` のシャローコピーで更新します。

### `rebuildColliders(): void`
このハンドルが保持している設定を使って、剛体のコライダーを置き換えます。

### `copyColliders(): ColliderOptions[]`
このハンドルが保持しているコライダー設定のシャローコピーを返します。

### `syncFromObject(): void`
オブジェクトの現在のワールド座標上の位置と回転を剛体へコピーします。キネマティック剛体の場合は次のキネマティック位置と回転を設定し、それ以外の剛体では位置と回転を直接設定します。

### `dispose(): void`
関連付けられた `PhysicsWorld` から、バインドされた剛体とコライダーを削除します。

---

## 6. 公開型

以下の型はパッケージのバレルからエクスポートされます。

* `BodyType`: `"dynamic"`、`"fixed"`、`"kinematicPosition"`、`"kinematicVelocity"` のいずれか
* `ColliderShapeSpec`: `autoBox`、`autoSphere`、`box`、`sphere`、`capsule`、`convexHull`、`trimesh` のいずれか
* `ColliderOptions`: コライダー形状と、任意のセンサー指定（`isSensor`）、衝突イベント有効化フラグ（`activeEvent`、`true` のとき `RAPIER.ActiveEvents.COLLISION_EVENTS` を有効化）、オフセット、ワールドスケール適用、タグ、摩擦、反発係数、密度
* `RigidBodyOptions`: 剛体タイプ、初期コライダー一覧、任意の回転ロック、線形・角減衰
* `CollisionEventPayload`: 2つのコライダーオブジェクト、それぞれの任意のタグ、衝突が開始または終了したかを示す情報
* `ColliderMeta`: コライダーオブジェクト、任意のタグ、センサーかどうかを示す情報。衝突コールバックとの関連付けに内部で使用されます。

形状パラメーター:

| 形状 | パラメーター | 動作 |
| :--- | :--- | :--- |
| `autoBox` | なし | 対象オブジェクト以下のメッシュ頂点（子孫を含む）の境界からボックスコライダーを作成します。 |
| `autoSphere` | なし | それらの頂点の軸平行境界ボックスを囲む球から、球コライダーを作成します。 |
| `box` | `halfExtents: [x, y, z]` | 指定された半サイズから直方体コライダーを作成します。 |
| `sphere` | `radius` | 球コライダーを作成します。 |
| `capsule` | `halfHeight`、`radius` | オブジェクトのローカルY軸に沿ったカプセルを作成します。 |
| `convexHull` | なし | 対象オブジェクト以下のメッシュ頂点から凸包を計算します。Rapierが作成できない場合はエラーをスローします。 |
| `trimesh` | なし | 対象オブジェクト以下のメッシュ頂点とインデックスから三角形メッシュを作成します。 |

明示的に指定するボックス、球、カプセルの寸法では、`applyWorldScale` の既定値は `true` です。`offset` の既定値は `[0, 0, 0]` です。自動形状では計算された中心オフセットも適用されます。コライダーの材質プロパティとタグは省略可能です。

---

## 7. 使用例

```typescript
import * as THREE from "three";
import { PhysicsWorld } from "./src/s-three-extensions";

const physics = await PhysicsWorld.create();
const geometry = new THREE.SphereGeometry(1);
const material = new THREE.MeshNormalMaterial();
const sphere = new THREE.Mesh(geometry, material);

const body = physics.addBody(sphere, {
    type: "dynamic",
    colliders: [{ shape: { type: "autoSphere" }, restitution: 0.5 }],
});

const unsubscribe = physics.onCollision((event) => {
    if (event.started) {
        console.log("衝突開始", event.selfObject, event.otherObject);
    }
});

function update(delta: number): void {
    physics.step(delta);
}

// 終了時:
unsubscribe();
body.dispose();
physics.dispose();
geometry.dispose();
material.dispose();
```
