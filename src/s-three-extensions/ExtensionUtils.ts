import * as THREE from "three";

export function addResizeCallback(
    dom: HTMLElement,
    callback: (width: number, height: number, pixelRatio: number) => void,
): ResizeObserver {
    const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
            return;
        }
        const { width, height } = entry.contentRect;
        callback(width, height, window.devicePixelRatio);
    });
    resizeObserver.observe(dom);
    return resizeObserver;
}

export function removeResizeCallback(resizeObserver: ResizeObserver) {
    resizeObserver.disconnect();
}

/**
 * Dispose Object3D.
 *
 * - delete Mesh / InstancedMesh : disposeObject3D(mesh, true)
 * - delete GLB : disposeObject3D(gltf.scene, true)
 * - delete FBX : disposeObject3D(fbxGroup, true)
 * @param root mesh
 * @param disposeResources true: delete all resources/ false: don't delete resources.
 * @returns void
 */
export function disposeObject3D(
    root: THREE.Object3D | null,
    disposeResources: boolean = false,
): void {
    if (root === null) return;

    root.removeFromParent();

    root.traverse((object) => {
        if ("dispose" in object && typeof object.dispose === "function") {
            object.dispose();
        }
        if (object instanceof THREE.SkinnedMesh) {
            object.skeleton?.dispose();
        }

        if (disposeResources && object instanceof THREE.Mesh) {
            object.geometry?.dispose();

            const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            for (const material of materials) {
                if (!material) continue;

                for (const value of Object.values(material)) {
                    if (value instanceof THREE.Texture) {
                        value.dispose();
                    }
                }
                material.dispose();
            }
        }
    });
}

export function disposeMesh(
    mesh: THREE.Mesh | null,
    disposeGeometryAndMaterial: boolean = false,
) {
    if (mesh !== null) {
        mesh.removeFromParent();

        if ("dispose" in mesh && typeof mesh.dispose === "function") {
            mesh.dispose();
        }

        if (disposeGeometryAndMaterial) {
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => material.dispose());
            } else {
                mesh.material?.dispose();
            }
        }
    }
}

export function disposeLight(
    light: THREE.Light | null,
    deleteAllResources: boolean = false,
) {
    if (light === null) {
        return;
    }
    light.removeFromParent();

    if ("target" in light && light.target instanceof THREE.Object3D) {
        light.target.removeFromParent();
    }

    if (
        deleteAllResources &&
        "map" in light &&
        light.map instanceof THREE.Texture
    ) {
        light.map.dispose();
        light.map = null;
    }

    light.dispose();
}
