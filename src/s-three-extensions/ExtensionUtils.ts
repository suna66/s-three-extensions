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
