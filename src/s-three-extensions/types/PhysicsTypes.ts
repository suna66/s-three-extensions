import * as THREE from "three";

export type BodyType =
    | "dynamic"
    | "fixed"
    | "kinematicPosition"
    | "kinematicVelocity";

export type ColliderShapeSpec =
    | { type: "autoBox" }
    | { type: "autoSphere" }
    | { type: "box"; halfExtents: [number, number, number] }
    | { type: "sphere"; radius: number }
    | { type: "capsule"; halfHeight: number; radius: number }
    | { type: "convexHull" }
    | { type: "trimesh" };

export interface ColliderOptions {
    shape: ColliderShapeSpec;
    isSensor?: boolean;
    offset?: [number, number, number];
    applyWorldScale?: boolean;
    tag?: string;
    friction?: number;
    restitution?: number;
    density?: number;
}

export interface RigidBodyOptions {
    type: BodyType;
    colliders?: ColliderOptions[];
    lockRotations?: [boolean, boolean, boolean];
    linearDamping?: number;
    angularDamping?: number;
}

export interface CollisionEventPayload {
    selfObject: THREE.Object3D;
    selfTag?: string;
    otherObject: THREE.Object3D;
    otherTag?: string;
    started: boolean;
}
