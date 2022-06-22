import { decode } from "./shortsocket.js";
import { writable } from 'svelte/store';


let assets_ = writable({});

let keys_ = writable(new Set());


export {
    assets_ as assets,
    keys_ as keys
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


export class Connection {
    constructor() {
        this.conn = null;
        this.onpacket = (respond, data) => {};
        this.onstatus = (data) => {};
        this.onconnect = () => {};
    }

    connect(addr) {
        this.conn = new WebSocket(addr);

        this.conn.binaryType = "arraybuffer";

        let connection = this;
        this.conn.onmessage = (e) => {
            connection.message(e.data);
        };
        this.conn.onopen = () => {
            connection.onconnect();
        };
    }

    send(message) {
        this.conn.send(message);
    }

    message(data) {
        /*
        let connection = this;
        if (data instanceof Blob) {
            let result = "";
            let reader = data.slice(1).stream().getReader();
            reader.read().then(function processText({ done, value }) {
                if (done) {
                    let bytes = [];
                    for (let byte of result.split(",")) {
                        bytes.push(parseInt(byte));
                    }
                    connection.onpacket(decode(bytes));
                    return;
                }
                
                result += value;
                return reader.read().then(processText);
            });
        } else {
            this.onstatus(JSON.parse(data.slice(1)));
        }
        */
        let connection = this;
        if (data instanceof ArrayBuffer) {
            let gameData = decode(new Uint8Array(data.slice(1)));
            // console.log(new Uint8Array(data)[0]);
            if (new Uint8Array(data)[0] == 82) {
                connection.onpacket(true, gameData);
            } else {
                connection.onpacket(false, gameData);
            }
        } else {
            if (data == "F") {
                connection.onpacket(false, null);
            } else {
                this.onstatus(JSON.parse(data.slice(1)));
            }
        }
    }
}
