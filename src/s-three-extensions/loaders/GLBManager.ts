import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

export default class GLBManager {
    private _gltfLoader: GLTFLoader;
    private static _instance: GLBManager;

    private constructor() {
        this._gltfLoader = new GLTFLoader();
    }

    public static getInstance(): GLBManager {
        if (!this._instance) this._instance = new GLBManager();
        return this._instance;
    }

    public loadAsync(
        url: string,
        onProgress?: (event: ProgressEvent) => void,
    ): Promise<GLTF> {
        return this._gltfLoader.loadAsync(url, onProgress);
    }

    public load(
        url: string,
        onLoad: (gltf: GLTF) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (err: unknown) => void,
    ): void {
        this._gltfLoader.load(url, onLoad, onProgress, onError);
    }
}
