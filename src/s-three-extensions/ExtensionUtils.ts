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
