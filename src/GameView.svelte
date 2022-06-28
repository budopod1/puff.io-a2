<script>
    import { assets, keys } from "./globals.js";
	import { onMount } from 'svelte';
    import { getContext } from 'svelte';
    import { decode } from "./shortsocket.js";
    
    let world = {"tilemap": {}, "entities": [], "player_x": 0, "player_y": 0};
    let canvas;
    let lastKeys = new Set();
    let ctx;
    let width;
    let height;
    let maxWidth;
    let maxRatio = 3;
    let animationFrame;
    $: if (canvas) canvas.width = Math.min(
        width, height * maxRatio
    );
    $: if (canvas) canvas.height = height;

    let conn = getContext('connection')();
    
    window._world = world;
    window._websocket = conn;
    
    // let timer = new Timer();
    conn.onmessage = (e) => {
        let data = e.data;
        
        if (data instanceof ArrayBuffer) {
            let packet = decode(new Uint8Array(data.slice(1)));
            // console.log(new Uint8Array(data)[0]);
            let respond = new Uint8Array(data)[0] == 82;
            
            window._packet = packet;
            if (respond) {
                conn.send(input());
            }
            if (packet) {
                // console.log(packet);
                update(packet);
            }
        } else {
            if (data[0] != "S") {
                return;
            }
            data = data.slice(1);
            let msg = JSON.parse(data);
            if (msg.action == "connect") {
                console.log("Conntected to the server!");
            }
        }
    };

    function frame() {
        try {
            render();
            animationFrame = requestAnimationFrame(frame);
        } catch(err) {
            throw err;
        }
    }

    function zip(arrays) { // Modified from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
        return arrays[0].map(
            (_, i) => arrays.map(array => array[i])
        );
    }
    
    function update(packet) {
        // Maybe add entity & tile data?
        let [tile_xs, tile_ys, tile_types, entity_xs, entity_ys, entity_ids, player_index] = packet;
    
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
        for (let [entity_x, entity_y, entity_id] of zip([entity_xs, entity_ys, entity_ids])) {
            world["entities"].push({
                x: entity_x,
                y: entity_y,
                id: entity_id
            });
        }
    }
    
    function render() {
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
                    1: "grass",
                    2: "wood",
                    3: "leaves",
                    4: "stone",
                    5: "flowers"
                }[tile.type];
                let image = $assets[name + ".png"];
                if (!image) {
                    console.error(`Unable to draw tile ${tile.type}`);
                    continue;
                }
                let size = 1
                let scale = height / veiwHeight;
                let x = (tile["x"] - cameraX) * scale + width / 2;
                let y = -(tile["y"] - cameraY) * scale + height / 2;
                x -= scale / 2;
                y -= scale / 2;
                let screenSize = scale * size;
                if (!will_render(screenSize, x, y)) {
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
            }[Math.floor((entity.id + 126) / 16)];
            let image = $assets[name + ".png"];
            if (!image) {
                console.error(`Unable to draw entity ${tile.type}`);
                continue;
            }
            let size = 1
            let scale = height / veiwHeight;
            let x = (entity.x - cameraX) * scale + width / 2;
            let y = -(entity.y - cameraY) * scale + height / 2;
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

    function input() {
        let keysChanged = false;
        if (lastKeys.size !== $keys.size) {
            keysChanged = true;
        };
        for (let key of lastKeys) {
            if (!$keys.has(key)) {
                keysChanged = true;
            };
        }
        if (keysChanged) {
            lastKeys = new Set($keys);
            let keyBytes = new Uint8Array($keys.size + 1);
            keyBytes[0] = 75; // K or keys
            for (let key = 0; key < $keys.size; key++) {
                keyBytes[key + 1] = Array.from($keys)[key];
            }
            return keyBytes.buffer;
        } else {
            let output = new Uint8Array(1);
            output[0] = 78; // N or none
            return output.buffer;
        }
    }
    
    onMount(() => {
        conn.send("connect");
        
		ctx = canvas.getContext('2d');
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        animationFrame = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(animationFrame);
		};
    });
</script>

<article>
    <canvas 
        bind:this={canvas}
    ></canvas>
</article>

<svelte:window 
    bind:innerWidth={width} 
    bind:innerHeight={height}
/>

<style>
    article {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        background-color: black;
    }

    canvas {
        image-rendering: optimizeSpeed;
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-crisp-edges;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: -o-crisp-edges;
        image-rendering: crisp-edges;
        image-rendering: pixelated;
        -ms-interpolation-mode: nearest-neighbor;
    }
</style>
