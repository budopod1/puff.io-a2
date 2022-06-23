<script>
    import { assets, keys } from "./game.js";
	import { onMount } from 'svelte';
    import { getContext } from 'svelte';

    let conn = getContext('connection');
    let world = {"tilemap": {}, "entities": [], "player_x": 0, "player_y": 0};
    // let timer = new Timer();
    conn.onpacket = (respond, packet) => {
        window._packet = packet;
        if (respond) {
            conn.send(input($keys));
        }
        if (packet) {
            // console.log(packet);
            update(packet);
        }
        // timer.tick();
        // console.log(timer.fps);
        // conn.send(input($keys));
    };
    
    let canvas;
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

    function frame() {
        try {
            render();
            animationFrame = requestAnimationFrame(frame);
        } catch(err) {
            throw err;
        }
    }
    
    onMount(() => {
		ctx = canvas.getContext('2d');
        animationFrame = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(animationFrame);
		};
    });

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
                    4: "stone"
                }[tile.type];
                let image = $assets[name + ".png"];
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
            // console.log(entity.id + 126);
            // console.log(Math.floor((entity.id + 126) / 16))
            let name = {
                1: "puff"
            }[Math.floor((entity.id + 126) / 16)];
            let image = $assets[name + ".png"];
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

    function input(keySet) {
        let keys = Array.from(keySet);
        let keyBytes = new Uint8Array(keys.length);
        for (let key in keys) {
            keyBytes[key] = keys[key];
        }
        return keyBytes.buffer;
    }
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
</style>
