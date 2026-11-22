import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type {
    ColliderOptions,
    CollisionEventPayload,
    RigidBodyOptions,
} from "./types/PhysicsTypes";

export interface ColliderMeta {
    collider: RAPIER.Collider;
    object: THREE.Object3D;
    tag?: string;
    isSensor: boolean;
}

export class PhysicsBodyHandle {
    private colliderSpecs: ColliderOptions[] = [];
    public readonly object: THREE.Object3D;
    public readonly rigidBody: RAPIER.RigidBody;
    private readonly world: PhysicsWorld;
    private readonly tmpWorldPos = new THREE.Vector3();
    private readonly tmpWorldQuat = new THREE.Quaternion();

    constructor(
        object: THREE.Object3D,
        rigidBody: RAPIER.RigidBody,
        world: PhysicsWorld,
        initialColliders: ColliderOptions[] = [],
    ) {
        this.object = object;
        this.rigidBody = rigidBody;
        this.world = world;
        this.colliderSpecs = [...initialColliders];
    }

    public addCollider(options: ColliderOptions): RAPIER.Collider {
        this.colliderSpecs.push(options);
        return this.world.attachCollider(this.object, this.rigidBody, options);
    }

    public rebuildColliders(): void {
        this.world.replaceColliders(
            this.object,
            this.rigidBody,
            this.colliderSpecs,
        );
    }

    public syncFromObject(): void {
        this.object.updateWorldMatrix(true, false);
        this.object.getWorldPosition(this.tmpWorldPos);
        this.object.getWorldQuaternion(this.tmpWorldQuat);

        if (this.rigidBody.isKinematic()) {
            this.rigidBody.setNextKinematicTranslation(this.tmpWorldPos);
            this.rigidBody.setNextKinematicRotation(this.tmpWorldQuat);
        } else {
            this.rigidBody.setTranslation(this.tmpWorldPos, true);
            this.rigidBody.setRotation(this.tmpWorldQuat, true);
        }
    }

    public dispose(): void {
        this.world.removeObject(this.object);
    }
}

export class PhysicsWorld {
    private world: RAPIER.World;
    private eventQueue: RAPIER.EventQueue;
    private bindings = new Map<THREE.Object3D, PhysicsBodyHandle>();
    private dynamicBindings = new Map<THREE.Object3D, PhysicsBodyHandle>();
    private colliderMetaMap = new Map<number, ColliderMeta>();
    private listeners = new Set<(event: CollisionEventPayload) => void>();
    private isDisposed = false;

    private readonly tmpWorldPos = new THREE.Vector3();
    private readonly tmpWorldQuat = new THREE.Quaternion();
    private readonly tmpWorldScale = new THREE.Vector3();
    private readonly tmpParentQuat = new THREE.Quaternion();
    private readonly tmpParentQuatInv = new THREE.Quaternion();

    private constructor(gravity = { x: 0, y: -9.81, z: 0 }) {
        this.world = new RAPIER.World(gravity);
        this.eventQueue = new RAPIER.EventQueue(true);
    }

    public static async create(
        gravity = { x: 0, y: -9.81, z: 0 },
    ): Promise<PhysicsWorld> {
        await RAPIER.init();
        return new PhysicsWorld(gravity);
    }

    public getPhysicsBodyHandle(obj: THREE.Object3D): PhysicsBodyHandle | null {
        return this.bindings.get(obj) ?? null;
    }

    public get disposed(): boolean {
        return this.isDisposed;
    }

    public get debugRenderer(): {
        vertices: Float32Array;
        colors: Float32Array;
    } {
        return this.world.debugRender();
    }

    public dispose(): void {
        if (this.isDisposed) return;
        this.isDisposed = true;

        this.bindings.clear();
        this.dynamicBindings.clear();
        this.colliderMetaMap.clear();
        this.listeners.clear();

        this.eventQueue.free();
        this.world.free();
    }

    public addBody(
        object: THREE.Object3D,
        options: RigidBodyOptions,
    ): PhysicsBodyHandle {
        if (this.bindings.has(object)) {
            this.removeObject(object);
        }

        object.updateWorldMatrix(true, false);
        object.getWorldPosition(this.tmpWorldPos);
        object.getWorldQuaternion(this.tmpWorldQuat);

        const desc = this.createRigidBodyDesc(options.type)
            .setTranslation(
                this.tmpWorldPos.x,
                this.tmpWorldPos.y,
                this.tmpWorldPos.z,
            )
            .setRotation(this.tmpWorldQuat);

        if (options.linearDamping !== undefined)
            desc.setLinearDamping(options.linearDamping);
        if (options.angularDamping !== undefined)
            desc.setAngularDamping(options.angularDamping);

        const rigidBody = this.world.createRigidBody(desc);

        if (options.lockRotations) {
            const [rx, ry, rz] = options.lockRotations;
            rigidBody.setEnabledRotations(!rx, !ry, !rz, true);
        }

        const initialColliders = options.colliders ?? [];
        for (const colOpt of initialColliders) {
            this.attachCollider(object, rigidBody, colOpt);
        }

        const handle = new PhysicsBodyHandle(
            object,
            rigidBody,
            this,
            initialColliders,
        );
        this.bindings.set(object, handle);
        if (options.type === "dynamic") {
            this.dynamicBindings.set(object, handle);
        }
        return handle;
    }

    public addSensor(
        object: THREE.Object3D,
        shape: ColliderOptions["shape"],
        options?: Omit<ColliderOptions, "shape" | "isSensor">,
    ): PhysicsBodyHandle {
        return this.addBody(object, {
            type: "fixed",
            colliders: [{ ...options, shape, isSensor: true }],
        });
    }

    public attachCollider(
        object: THREE.Object3D,
        rigidBody: RAPIER.RigidBody,
        options: ColliderOptions,
    ): RAPIER.Collider {
        object.updateWorldMatrix(true, true);

        const { desc, autoOffset } = this.createColliderDesc(object, options);
        const isSensor = options.isSensor ?? false;
        const applyScale = options.applyWorldScale ?? true;

        if (applyScale) {
            object.getWorldScale(this.tmpWorldScale);
        } else {
            this.tmpWorldScale.set(1, 1, 1);
        }

        desc.setSensor(isSensor);
        if (options.activeEvent == true)
            desc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

        const ox = (options.offset?.[0] ?? 0) * this.tmpWorldScale.x + autoOffset.x;
        const oy = (options.offset?.[1] ?? 0) * this.tmpWorldScale.y + autoOffset.y;
        const oz = (options.offset?.[2] ?? 0) * this.tmpWorldScale.z + autoOffset.z;
        desc.setTranslation(ox, oy, oz);

        if (options.friction !== undefined) desc.setFriction(options.friction);
        if (options.restitution !== undefined)
            desc.setRestitution(options.restitution);
        if (options.density !== undefined) desc.setDensity(options.density);

        const collider = this.world.createCollider(desc, rigidBody);
        this.colliderMetaMap.set(collider.handle, {
            collider,
            object,
            tag: options.tag,
            isSensor,
        });

        return collider;
    }

    public replaceColliders(
        object: THREE.Object3D,
        rigidBody: RAPIER.RigidBody,
        specs: ColliderOptions[],
    ): void {
        this.detachAllColliders(rigidBody);
        for (const spec of specs) {
            this.attachCollider(object, rigidBody, spec);
        }
    }

    public onCollision(
        listener: (event: CollisionEventPayload) => void,
    ): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public step(dt: number): void {
        this.world.timestep = dt;
        this.world.step(this.eventQueue);

        for (const [object, handle] of this.dynamicBindings) {
            const t = handle.rigidBody.translation();
            const r = handle.rigidBody.rotation();

            this.tmpWorldPos.set(t.x, t.y, t.z);
            this.tmpWorldQuat.set(r.x, r.y, r.z, r.w);

            const parent = object.parent;
            if (parent && parent.type !== "Scene") {
                parent.updateWorldMatrix(true, false);
                parent.worldToLocal(this.tmpWorldPos);
                object.position.copy(this.tmpWorldPos);

                parent.getWorldQuaternion(this.tmpParentQuat);
                this.tmpParentQuatInv.copy(this.tmpParentQuat).invert();
                object.quaternion
                    .copy(this.tmpParentQuatInv)
                    .multiply(this.tmpWorldQuat);
            } else {
                object.position.copy(this.tmpWorldPos);
                object.quaternion.copy(this.tmpWorldQuat);
            }
        }

        this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            const meta1 = this.colliderMetaMap.get(handle1);
            const meta2 = this.colliderMetaMap.get(handle2);
            if (!meta1 || !meta2) return;

            for (const listener of this.listeners) {
                listener({
                    selfCollider: meta1.collider,
                    selfObject: meta1.object,
                    selfTag: meta1.tag,
                    otherCollider: meta2.collider,
                    otherObject: meta2.object,
                    otherTag: meta2.tag,
                    started,
                });
            }
        });
    }

    public removeObject(object: THREE.Object3D): void {
        const handle = this.bindings.get(object);
        if (!handle) return;

        this.detachAllColliders(handle.rigidBody);
        this.world.removeRigidBody(handle.rigidBody);
        this.bindings.delete(object);
        this.dynamicBindings.delete(object);
    }

    private detachAllColliders(rigidBody: RAPIER.RigidBody): void {
        for (let i = rigidBody.numColliders() - 1; i >= 0; i--) {
            const col = rigidBody.collider(i);
            this.colliderMetaMap.delete(col.handle);
            this.world.removeCollider(col, true);
        }
    }

    private createRigidBodyDesc(
        type: RigidBodyOptions["type"],
    ): RAPIER.RigidBodyDesc {
        switch (type) {
            case "dynamic":
                return RAPIER.RigidBodyDesc.dynamic();
            case "fixed":
                return RAPIER.RigidBodyDesc.fixed();
            case "kinematicPosition":
                return RAPIER.RigidBodyDesc.kinematicPositionBased();
            case "kinematicVelocity":
                return RAPIER.RigidBodyDesc.kinematicVelocityBased();
        }
    }

    private forEachScaledLocalVertex(
        root: THREE.Object3D,
        callback: (vertex: THREE.Vector3) => void,
    ): void {
        root.updateWorldMatrix(true, true);

        const rootWorldPos = new THREE.Vector3();
        const rootWorldQuat = new THREE.Quaternion();
        const rootWorldScale = new THREE.Vector3();
        root.matrixWorld.decompose(rootWorldPos, rootWorldQuat, rootWorldScale);

        const scaleOnlyRootMatrix = new THREE.Matrix4().compose(
            new THREE.Vector3(0, 0, 0),
            new THREE.Quaternion(),
            rootWorldScale,
        );
        const invRootMatrix = root.matrixWorld.clone().invert();
        const toScaledLocal = new THREE.Matrix4();
        const v = new THREE.Vector3();

        root.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const posAttr = child.geometry.getAttribute("position");
            if (!posAttr) return;

            toScaledLocal
                .copy(child.matrixWorld)
                .premultiply(invRootMatrix)
                .premultiply(scaleOnlyRootMatrix);

            for (let i = 0; i < posAttr.count; i++) {
                v.fromBufferAttribute(posAttr, i).applyMatrix4(toScaledLocal);
                callback(v);
            }
        });
    }

    private extractScaledLocalVertices(root: THREE.Object3D): Float32Array {
        const positions: number[] = [];
        this.forEachScaledLocalVertex(root, (v) => {
            positions.push(v.x, v.y, v.z);
        });
        return new Float32Array(positions);
    }

    private extractMergedIndices(root: THREE.Object3D): Uint32Array {
        const indices: number[] = [];
        let vertexOffset = 0;

        root.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            const posAttr = child.geometry.getAttribute("position");
            if (!posAttr) return;

            const indexAttr = child.geometry.getIndex();
            if (indexAttr) {
                for (let i = 0; i < indexAttr.count; i++) {
                    indices.push(indexAttr.getX(i) + vertexOffset);
                }
            } else {
                for (let i = 0; i < posAttr.count; i++) {
                    indices.push(i + vertexOffset);
                }
            }
            vertexOffset += posAttr.count;
        });

        return new Uint32Array(indices);
    }

    private createColliderDesc(
        object: THREE.Object3D,
        options: ColliderOptions,
    ): { desc: RAPIER.ColliderDesc; autoOffset: THREE.Vector3 } {
        const autoOffset = new THREE.Vector3();
        const spec = options.shape;
        const applyScale = options.applyWorldScale ?? true;

        const worldScale = new THREE.Vector3(1, 1, 1);
        if (applyScale) {
            object.getWorldScale(worldScale);
        }

        switch (spec.type) {
            case "autoBox": {
                const box = new THREE.Box3();
                this.forEachScaledLocalVertex(object, (v) => {
                    box.expandByPoint(v);
                });

                const size = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(autoOffset);

                return {
                    desc: RAPIER.ColliderDesc.cuboid(
                        size.x / 2,
                        size.y / 2,
                        size.z / 2,
                    ),
                    autoOffset,
                };
            }
            case "autoSphere": {
                const box = new THREE.Box3();
                this.forEachScaledLocalVertex(object, (v) => {
                    box.expandByPoint(v);
                });

                box.getCenter(autoOffset);

                let maxRadiusSq = 0;
                this.forEachScaledLocalVertex(object, (v) => {
                    maxRadiusSq = Math.max(
                        maxRadiusSq,
                        autoOffset.distanceToSquared(v),
                    );
                });

                return {
                    desc: RAPIER.ColliderDesc.ball(Math.sqrt(maxRadiusSq)),
                    autoOffset,
                };
            }
            case "box": {
                const [hx, hy, hz] = spec.halfExtents;
                return {
                    desc: RAPIER.ColliderDesc.cuboid(
                        hx * Math.abs(worldScale.x),
                        hy * Math.abs(worldScale.y),
                        hz * Math.abs(worldScale.z),
                    ),
                    autoOffset,
                };
            }
            case "sphere": {
                const maxRadiusScale = Math.max(
                    Math.abs(worldScale.x),
                    Math.abs(worldScale.y),
                    Math.abs(worldScale.z),
                );
                return {
                    desc: RAPIER.ColliderDesc.ball(
                        spec.radius * maxRadiusScale,
                    ),
                    autoOffset,
                };
            }
            case "capsule": {
                const radialScale = Math.max(
                    Math.abs(worldScale.x),
                    Math.abs(worldScale.z),
                );
                return {
                    desc: RAPIER.ColliderDesc.capsule(
                        spec.halfHeight * Math.abs(worldScale.y),
                        spec.radius * radialScale,
                    ),
                    autoOffset,
                };
            }
            case "convexHull": {
                const vertices = this.extractScaledLocalVertices(object);
                const desc = RAPIER.ColliderDesc.convexHull(vertices);
                if (!desc)
                    throw new Error(
                        "Failed to compute convex hull from geometry.",
                    );
                return { desc, autoOffset };
            }
            case "trimesh": {
                const vertices = this.extractScaledLocalVertices(object);
                const indices = this.extractMergedIndices(object);
                return {
                    desc: RAPIER.ColliderDesc.trimesh(vertices, indices),
                    autoOffset,
                };
            }
        }
    }
}
