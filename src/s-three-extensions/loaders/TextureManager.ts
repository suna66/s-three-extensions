import * as THREE from "three";

export default class TextureManager {
    private _textureLoader: THREE.TextureLoader;
    private static _instance: TextureManager;

    private constructor() {
        this._textureLoader = new THREE.TextureLoader();
    }

    public static getInstance(): TextureManager {
        if (!this._instance) this._instance = new TextureManager();
        return this._instance;
    }

    public loadAsync(
        filename: string,
        onProgress?: (event: ProgressEvent) => void,
    ): Promise<THREE.Texture> {
        return this._textureLoader.loadAsync(filename, onProgress);
    }

    public load(
        filename: string,
        onLoad?: (texture: THREE.Texture) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (err: unknown) => void,
    ): THREE.Texture {
        return this._textureLoader.load(filename, onLoad, onProgress, onError);
    }
}
