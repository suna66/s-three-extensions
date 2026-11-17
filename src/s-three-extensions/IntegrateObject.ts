import * as THREE from "three";
import type { PhysicsBodyHandle } from "./PhysicsWorld";

export default class IntegrateObject {
    private _mesh: THREE.Mesh | null = null;
    private _physicsBodyHandle: PhysicsBodyHandle | null = null;

    constructor(mesh: (() => THREE.Mesh) | THREE.Mesh | null = null) {
        if (typeof mesh === "function") {
            this._mesh = mesh();
        } else {
            this._mesh = mesh;
        }
    }

    public get mesh(): THREE.Mesh | null {
        return this._mesh;
    }

    public get physicsBodyHandle(): PhysicsBodyHandle | null {
        return this._physicsBodyHandle;
    }

    public setMesh(func: () => THREE.Mesh) {
        this._mesh = func();
    }

    public setPhysicalBody(func: (mesh: THREE.Mesh) => PhysicsBodyHandle) {
        if (this._mesh === null) {
            throw new Error(
                "A mesh must be added before adding a physical body.",
            );
        }
        this._physicsBodyHandle = func(this._mesh);
    }

    public dispose(isDelete: boolean = false) {
        if (isDelete && this._mesh !== null) {
            this._mesh.geometry.dispose();
            if (Array.isArray(this._mesh.material)) {
                this._mesh.material.forEach((material) => material.dispose());
            } else {
                this._mesh.material.dispose();
            }
        }
        if (this._physicsBodyHandle !== null) {
            this._physicsBodyHandle.dispose();
        }
        this._mesh = null;
        this._physicsBodyHandle = null;
    }
}
