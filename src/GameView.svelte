<script>
    import { assets, keys, mouseX, mouseY, mouseButtons, mouseWheel } from "./globals.js";
	import { onMount } from 'svelte';
    import { getContext } from 'svelte';
    import { decode } from "./shortsocket.js";
    
    let world = {"tilemap": {}, "entities": [], "player_x": 0, "player_y": 0};
    let canvas;
    let lastKeys = new Set();
    let lastMouseButtons = new Set();
    let lastMouseX = 0;
    let lastMouseY = 0;
    let guiSize = 0.7;
    let containerItemScale = 0.5;
    let selectedScale = 0.75;
    let selected = 0;
    let gui = 0;
    let inventory = [];
    let trades = [];
    let ctx;
    let width;
    let height;
    let maxWidth;
    let maxRatio = 3;
    let veiwHeight = 7;
    let tileIDs = {
        '-1': "empty", // https://stackoverflow.com/questions/8182183/javascript-assoc-array-with-negative-int-keys
        1: "grass",
        2: "wood",
        3: "leaves",
        4: "stone",
        5: "flowers",
        6: "trader1"
    };
    let entityIDs = {
        1: "puff"
    };
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
            let respond = new Uint8Array(data)[0] == 82;
            
            window._packet = packet;
            if (respond) {
                conn.send(input());
            }
            if (packet) {
                anyPacket(packet);
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

    function anyPacket(packet) {
        if (packet.length == 7) {
            gui = 0;
            normalPacket(packet);
        } else {
            let [gui_, items, amounts] = packet;
            gui = gui_[0];
            let newContainer = zip([items, amounts]);
            switch (gui) {
                case 1:
                    inventory = newContainer;
                    break;
                case 2:
                    trades = newContainer;
                    break;
                default:
                    console.error(`GUI ${gui} not implemented`);
            }
        }
    }
    
    function normalPacket(packet) {
        // Maybe add entity & tile data?w
        let [tile_xs, tile_ys, tile_types, entity_xs, entity_ys, entity_ids, more_data] = packet;

        let player_index = more_data[0];

        if (more_data.length == 2) {
            selected = more_data[1];
        }
    
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
    
        let cameraX = world["player_x"];
        let cameraY = world["player_y"];
    
        let will_render = (screenSize, x, y) => {
            return !(x + screenSize < 0 || x > width
               || y + screenSize < 0 || y > height); 
        }
        
        let scale = height / veiwHeight;
        
        for (let tile of Object.values(world.tilemap)) {
            if (tile.type != 0) {
                let name = tileIDs[tile.type];
                let image = $assets[name + ".png"];
                if (!image) {
                    console.error(`Unable to draw tile ${tile.type}`);
                    continue;
                }
                let size = 1;
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
            let name = entityIDs[Math.floor((entity.id + 126) / 16)];
            let image = $assets[name + ".png"];
            if (!image) {
                console.error(`Unable to draw entity ${entity.id}`);
                continue;
            }
            let size = 1;
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

        if (gui != 0) {
            renderGUI(gui);
        }

        if (selected) {
            let selectedName = tileIDs[selected];
            let selectedImage = $assets[selectedName + ".png"];
            let selectedSize = selectedScale * scale;
            ctx.fillStyle = "black";
            let outline = 3;
            ctx.fillRect(
                -outline,
                height - selectedSize - outline,
                selectedSize + outline * 2,
                selectedSize + outline * 2
            );
            ctx.drawImage(
                selectedImage,
                0,
                height - selectedSize,
                selectedSize,
                selectedSize
            );
        }
    }

    function renderGUI(gui) {
        let name = {
            1: "inventory",
            2: "trades"
        }[gui];
        // Check for container guis
        if (["inventory", "trades"].includes(name)) {
            let cellImage = $assets["cell.png"];
            let containerWidth = {
                "inventory": 8,
                "trades": 9
            }[name];
            let containerHeight = {
                "inventory": 4,
                "trades": 5
            }[name];
            let cellSize = guiSize * height / containerHeight;
            let itemSize = containerItemScale * cellSize;
            let containerItems = {
                "inventory": inventory,
                "trades": trades
            }[name];
            let containerPos = {};
            for (let i = 0; i < containerItems.length; i++) {
                let x = i%containerWidth;
                let y = Math.floor(i/containerWidth);
                console.log(`(${x}, ${y}) ${i}`);
                containerPos[`(${x}, ${y})`] = containerItems[i];
            }
            ctx.font = `bold ${itemSize}px JetBrains Mono`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            for (let x = 0; x < containerWidth; x++) {
                for (let y = 0; y < containerHeight; y++) {
                    let rx = width/2 + (x + 0.5 - containerWidth/2) * cellSize;
                    let ry = height/2 + (y + 0.5 - containerHeight/2) * cellSize;
                    ctx.drawImage(
                        cellImage,
                        rx - cellSize / 2,
                        ry - cellSize / 2,
                        cellSize,
                        cellSize
                    );
                    let slot = containerPos[`(${x}, ${y})`];
                    if (slot) {
                        let [item, amount] = slot;
                        if (item == 0) {
                            continue;
                        }
                        let name = tileIDs[item];
                        let image = $assets[name + ".png"];
                        let thisItemSize = item < 0 ? cellSize : itemSize;
                        ctx.drawImage(
                            image,
                            rx - thisItemSize / 2,
                            ry - thisItemSize / 2,
                            thisItemSize,
                            thisItemSize
                        );
                        if (amount > 1) {
                            ctx.fillStyle = "black";
                            ctx.fillText(
                                amount.toString(),
                                rx,
                                ry
                            );
                            ctx.strokeStyle = "white";
                            ctx.strokeText(
                                amount.toString(),
                                rx,
                                ry
                            );
                        }
                    }
                }
            }
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
            return keyBytes;
        }

        if ($mouseWheel) {
            let wheelBytes = new Uint8Array(5);
            wheelBytes[0] = 87; // W or wheel
            let wheelFloat = new Float32Array([$mouseWheel]);
            var wheelFloatBytes = new Uint8Array(wheelFloat.buffer);
            for (let i = 0; i < 4; i++) {
                wheelBytes[i + 1] = wheelFloatBytes[i];
            }
            $mouseWheel = 0;
            return wheelBytes;
        }

        let mouseButtonsChanged = false;
        if (lastMouseButtons.size !== $mouseButtons.size) {
            mouseButtonsChanged = true;
        };
        for (let button of lastMouseButtons) {
            if (!$mouseButtons.has(button)) {
                mouseButtonsChanged = true;
            };
        }

        if (mouseButtonsChanged && gui == 0) {
            lastMouseButtons = new Set($mouseButtons);
            let mouseBytes = new Uint8Array(2);
            for (let i = 0; i < 3; i++) {
                if ($mouseButtons.has(i + 1)) {
                    mouseBytes[1] += (1 << i);
                }
            }
            mouseBytes[0] = 66;
            return mouseBytes;
        }
        
        let mousePosChanged = false;
        if ($mouseX != lastMouseX) {
            mousePosChanged = true;
            lastMouseX = $mouseX;
        }
        if ($mouseY != lastMouseY) {
            mousePosChanged = true;
            lastMouseY = $mouseY;
        }
        
        if (mousePosChanged && gui == 0) {
            let mouseBytes = new Uint8Array(9);
            let scale = height / veiwHeight;
            let screenMouseX = $mouseX - width / 2;
            screenMouseX /= scale;
            let screenMouseY = $mouseY - height / 2;
            screenMouseY /= -scale;
            let mousePosFloats = new Float32Array([screenMouseX, screenMouseY]);
            var mousePosBytes = new Uint8Array(mousePosFloats.buffer);
            mouseBytes[0] = 77;
            for (let i = 0; i < 8; i++) {
                mouseBytes[1 + i] = mousePosBytes[i];
            }
            return mouseBytes;
        }
        
        let output = new Uint8Array(1);
        output[0] = 78; // N or none
        return output;
    }
    
    onMount(() => {
        conn.send("connect");

        canvas.oncontextmenu = (e) => {
            e.preventDefault();
        }
        
		ctx = canvas.getContext('2d');
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
        cursor: default;
    }
</style>
