interface V1Mod {
    name: string;
    render: () => string;
    mount: (container: HTMLElement) => Promise<void>;
}

class V1ModRunner {
    private mod: V1Mod;
    private container: HTMLElement | null = null;

    constructor(mod: V1Mod) {
        this.mod = mod;
    }

    async mount(container: HTMLElement) {
        this.container = container;
        container.innerHTML = this.mod.render();
        await this.mod.mount(container);
    }

    unmount() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
    }

    getModName(): string {
        return this.mod.name;
    }
}

export default V1ModRunner;
