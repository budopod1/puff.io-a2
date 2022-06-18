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


function zip(arrays) { // Modified from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
    return arrays[0].map(
        (_, i) => arrays.map(array => array[i])
    );
}


export function update(world, packet) {
    // Maybe add entity & tile data?
    let [tile_xs, tile_ys, tile_types, entity_xs, entity_ys, entity_types, player_index] = packet;
    window.packet = packet; // For debugging

    world["player_x"] = entity_xs[player_index];
    world["player_y"] = entity_ys[player_index];

    for (let [tile_x, tile_y, tile_type] of zip([tile_xs, tile_ys, tile_types])) {
        world["tilemap"][`(${tile_x}, ${tile_y})`] = {
            x: tile_x,
            y: tile_y,
            type: tile_type
        };
    }

    world["entities"] = [];
    for (let [entity_x, entity_y, entity_type] of zip([entity_xs, entity_ys, entity_types])) {
        world["entities"].push({
            x: entity_x,
            y: entity_y,
            type: entity_type
        });
    }

    window["world"] = world; // This is temporary
    
    return world;
}


export function render(assets, world, ctx, width, height) {
    ctx.fillStyle = "#3fd7e8";
    ctx.fillRect(0, 0, width, height);

    let veiwHeight = 7;
    let cameraX = world["player_x"];
    let cameraY = world["player_y"];

    let will_render = (screenSize, x, y) => {
        return !(x + screenSize < 0 || x > width
           || y + screenSize < 0 || y > height); 
    }
    
    for (let tile of Object.values(world.tilemap)) {
        if (tile.type != 0) {
            let name = {
                1: "grass"
            }[tile.type];
            let image = assets[name + ".png"];
            // console.log(image, assets, name + ".png");
            let size = 1
            let scale = height / veiwHeight;
            let x = (tile["x"] - cameraX) * scale + width / 2;
            let y = -(tile["y"] - cameraY) * scale + height / 2;
            x -= scale / 2;
            y -= scale / 2;
            let screenSize = scale * size;
            if (!will_render(screenSize, x, y)) {
                // console.log("hi!");
                continue;
            }
            ctx.drawImage(
                image,
                x,
                y,
                screenSize,
                screenSize
            );
        }
    }

    for (let entity of world.entities) {
        let name = {
            1: "puff"
        }[entity.type];
        let image = assets[name + ".png"];
        let size = 1
        let scale = height / veiwHeight;
        let x = (entity["x"] - cameraX) * scale + width / 2;
        let y = -(entity["y"] - cameraY) * scale + height / 2;
        x -= scale / 2;
        y -= scale / 2;
        ctx.drawImage(
            image,
            x,
            y,
            scale * size,
            scale * size
        );
    }
}

export function input(keySet) {
    let keys = Array.from(keySet);
    let keyBytes = new Uint8Array(keys.length);
    for (let key in keys) {
        keyBytes[key] = keys[key];
    }
    return keyBytes.buffer;
}
