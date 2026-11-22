import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

export default class FBXManager {
    private _fbxLoader: FBXLoader;
    private static _instance: FBXManager;

    private constructor() {
        this._fbxLoader = new FBXLoader();
    }

    public static getInstance(): FBXManager {
        if (!this._instance) this._instance = new FBXManager();
        return this._instance;
    }

    public loadAsync(
        url: string,
        onProgress?: (event: ProgressEvent) => void,
    ): Promise<THREE.Group> {
        return this._fbxLoader.loadAsync(url, onProgress);
    }

    public load(
        url: string,
        onLoad: (group: THREE.Group) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (err: unknown) => void,
    ): void {
        this._fbxLoader.load(url, onLoad, onProgress, onError);
    }
}
