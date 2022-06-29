import { writable } from 'svelte/store';


let assets_ = writable({});

let keys_ = writable(new Set());

let mouseX_ = writable(0);
let mouseY_ = writable(0);

export {
    assets_ as assets,
    keys_ as keys,
    mouseX_ as mouseX,
    mouseY_ as mouseY
}


export class Timer {
    constructor() {
        this.lastTick = this.unixTime();
        this.timeDelta = 0;
    }

    unixTime() {
        return +new Date() / 1000;
    }

    tick() {
        let now = this.unixTime();
        this.timeDelta = now - this.lastTick;
        this.lastTick = now;
    }

    get fps() {
        return 1 / this.timeDelta;
    }
}
