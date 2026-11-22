# `Raycast` クラス インターフェース仕様

## 1. 概要
`Raycast` は `THREE.Raycaster` をラップし、DOM要素を基準としたスクリーン座標（クライアント座標）から Three.js の `Object3D` に対するレイキャスト判定を行います。

* **依存関係:** `three`
* **エクスポート形式:** `export default class Raycast`。`src/s-three-extensions/index.ts` から `Raycast` として再エクスポートされます。

---

## 2. コンストラクター

### `constructor(dom: HTMLElement, camera: THREE.Camera)`
指定されたDOM要素とカメラに紐づいた内部 `THREE.Raycaster` を作成します。

* **パラメーター:**
  * `dom` (`HTMLElement`): ポインター座標の正規化に `getBoundingClientRect()` を使用する要素（通常は `this.domElement`）。
  * `camera` (`THREE.Camera`): レイの起点となるカメラ。

---

## 3. メソッド

### `mousePoint(x: number, y: number, objects: Array<THREE.Object3D>, recursive: boolean = true): THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]`
クライアント座標 `(x, y)`（`PointerEvent.clientX` / `PointerEvent.clientY` など）を `dom.getBoundingClientRect()` を用いて正規化デバイス座標（NDC）へ変換し、カメラのワールド行列を更新した上で `objects` との交差判定を行います。

* **パラメーター:**
  * `x` (`number`): クライアントX座標。
  * `y` (`number`): クライアントY座標。
  * `objects` (`Array<THREE.Object3D>`): 交差判定の対象とするオブジェクト配列。
  * `recursive` (`boolean`、省略可、既定値 `true`): `true` の場合、各オブジェクトの子孫も再帰的に判定します。
* **戻り値:** 距離順にソートされた `THREE.Intersection` の配列。

---

## 4. 使用例

```typescript
import * as THREE from "three";
import {
    Raycast,
    SceneController,
    SceneObject,
    StudioControls,
} from "./src/s-three-extensions";

class PickingScene extends SceneController {
    private box: SceneObject | null = null;

    public start(): void {
        this.controller = new StudioControls(this.camera, this.domElement);
        this.box = new SceneObject(
            new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshNormalMaterial(),
            ),
        );
        this.addMesh(this.box);

        const ray = new Raycast(this.domElement, this.camera);
        const targets: THREE.Object3D[] = [this.box.mesh!];

        this.controller.mouseMoveEvent = (event: PointerEvent) => {
            const intersects = ray.mousePoint(
                event.clientX,
                event.clientY,
                targets,
                false,
            );
            if (intersects.length > 0) {
                console.log("Hit!", intersects[0]);
            }
        };
    }

    public update(_delta: number): void {}

    public override delete(): void {
        this.removeAllMesh();
        this.box?.dispose(true);
    }
}
```
