import * as THREE from "three";

export default class Raycast {
    private _raycaster: THREE.Raycaster;
    private _dom: HTMLElement;
    private _camera: THREE.Camera;

    private _pointer = new THREE.Vector2();

    constructor(dom: HTMLElement, camera: THREE.Camera) {
        this._raycaster = new THREE.Raycaster();
        this._dom = dom;
        this._camera = camera;
    }

    public mousePoint(
        x: number,
        y: number,
        objects: Array<THREE.Object3D>,
        recursive: boolean = true,
    ): THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[] {
        const rect = this._dom.getBoundingClientRect();
        this._pointer.set(
            ((x - rect.left) / rect.width) * 2 - 1,
            -((y - rect.top) / rect.height) * 2 + 1,
        );
        this._camera.updateMatrixWorld();
        this._raycaster.setFromCamera(this._pointer, this._camera);
        const intersects = this._raycaster.intersectObjects(objects, recursive);

        return intersects;
    }
}
