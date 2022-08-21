<script>
    import { assets, keys, mouseX, mouseY, mouseButtons, mouseWheel } from "./globals.js";
	import { onMount, getContext } from 'svelte';
    import { decode } from "./shortsocket.js";

    let canvas;
    let animationFrame;
    let ctx;
    let width;
    let height;
    let maxWidth;
    
    let lastKeys = new Set();
    let lastMouseButtons = new Set();
    let lastMouseX = 0;
    let lastMouseY = 0;
    
    const world = {"tilemap": {}, "entities": [], "player_x": 0, "player_y": 0};
    let container = [];
    let containerBoundaries = [];
    
    let selected = 0;
    let health = 0;
    let playerIndex = 0;
    let containerType = 0;
    
    const containerSize = 0.7;
    const containerItemScale = 0.5;
    const selectedScale = 0.75;

    let healthScale = 0.05;
    
    const maxRatio = 3;
    const veiwHeight = 7;

    // https://stackoverflow.com/questions/8182183/javascript-assoc-array-with-negative-int-keys
    const tileIDs = {
        '-1': "empty",
        '-2': "arrow",
        '-3': "iron",
        '-3': "drill1",
        '-4': "drill2",
        1: "grass",
        2: "stone",
        3: "wood",
        4: "leaves",
        5: "planks",
        6: "flowers",
        7: "mango",
        8: "trader1",
        9: "stone", // iron ore
        10: "sapling",
        11: "trader1stall",
    };
    let fullTiles = [
        "empty", "arrow"
    ];
    const entityIDs = {
        1: "puff",
        2: "zombie"
    };

    const containerNames = {
        1: "inventory",
        2: "trades"
    };
    const containerWidths = {
        "inventory": 8,
        "trades": 9
    };
    const containerHeights = {
        "inventory": 4,
        "trades": 5
    };
    
    $: if (canvas) canvas.width = Math.min(
        width, height * maxRatio
    );
    $: if (canvas) canvas.height = height;

    let conn = getContext('connection')();
    
    window._world = world;
    window._websocket = conn;

    function response() {
        conn.send(input());
    }
    
    conn.onmessage = (e) => {
        let data = e.data;
        
        if (data instanceof ArrayBuffer) {
            let packet = decode(new Uint8Array(data.slice(1)));
            let respond = new Uint8Array(data)[0] == 82;
            
            window._packet = packet;
            if (respond) {
                response();
            }
            if (packet) {
                anyPacket(packet);
            }
        } else {
            if (data[0] != "S") {
                return;
            }
            data = data.slice(1);
            let msg = JSON.parse(data); // No use for statuses yet
            if (msg.action == "ready") {
                response();
            }
        }
    };

    function frame() {
        render();
        animationFrame = requestAnimationFrame(frame);
    }

    function zip(arrays) { // Modified from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
        return arrays[0].map(
            (_, i) => arrays.map(array => array[i])
        );
    }

    function anyPacket(packet) {
        if (packet.length == 7) {
            containerType = 0;
            normalPacket(packet);
        } else {
            let [containerType_, items, amounts] = packet;
            containerType = containerType_[0];
            container = zip([items, amounts]);
        }
    }
    
    function normalPacket(packet) {
        // Maybe add entity & tile data?
        let [tile_xs, tile_ys, tile_types, entity_xs, entity_ys, entity_ids, more_data] = packet;

        if (more_data.length >= 1) {
            playerIndex = more_data[0];
    
            if (more_data.length >= 2) {
                selected = more_data[1];
    
                if (more_data.length >= 3) {
                    health = more_data[2];
                }
            }
        }
    
        world["player_x"] = entity_xs[playerIndex];
        world["player_y"] = entity_ys[playerIndex];
    
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

        if (containerType) {
            renderContainer();
        } else {
            let HP = health;
            let healthSize = healthScale * height;
            let x = width;
            
            while (HP >= 2) {
                ctx.drawImage(
                    $assets["wind2.png"],
                    x - healthSize,
                    height - healthSize,
                    healthSize,
                    healthSize
                );
                x -= healthSize;
                HP -= 2;
            }
            
            if (HP == 1) {
                ctx.drawImage(
                    $assets["wind1.png"],
                    x - healthSize,
                    height - healthSize,
                    healthSize,
                    healthSize
                )
            }
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

    function renderContainer() {
        let name = containerNames[containerType];
        let cellImage = $assets["cell.png"];
        let containerWidth = containerWidths[name];
        let containerHeight = containerHeights[name];
        let cellSize = containerSize * height / containerHeight;
        let itemSize = containerItemScale * cellSize;
        let containerPos = {};
        for (let i = 0; i < container.length; i++) {
            let x = i%containerWidth;
            let y = Math.floor(i/containerWidth);
            containerPos[`(${x}, ${y})`] = container[i];
        }
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        containerBoundaries = [];
        for (let x = 0; x < containerWidth; x++) {
            for (let y = 0; y < containerHeight; y++) {
                // Real x & y
                let rx = width/2 + (x + 0.5 - containerWidth/2) * cellSize;
                let ry = height/2 + (y + 0.5 - containerHeight/2) * cellSize;
                // Final x & y
                let fx = rx - cellSize / 2;
                let fy = ry - cellSize / 2;
                ctx.drawImage(
                    cellImage,
                    fx,
                    fy,
                    cellSize,
                    cellSize
                );
                let slot = containerPos[`(${x}, ${y})`];
                containerBoundaries.push([
                    x, y, fx, fy, fx + cellSize, fy + cellSize
                ]);
                if (slot) {
                    let [item, amount] = slot;
                    if (item == 0) {
                        continue;
                    }
                    let name = tileIDs[item];
                    let image = $assets[name + ".png"];
                    if (!image) {
                        console.error(`Unable to draw item with id ${item}`);
                        continue;
                    }
                    let isFull = fullTiles.includes(name);
                    let thisItemSize = isFull ? cellSize : itemSize;
                    ctx.drawImage(
                        image,
                        rx - thisItemSize / 2,
                        ry - thisItemSize / 2,
                        thisItemSize,
                        thisItemSize
                    );
                    if (amount > 1) {
                        ctx.font = `bold ${itemSize}px JetBrains Mono`;
                        ctx.fillStyle = "white";
                        ctx.fillText(
                            amount.toString(),
                            rx,
                            ry
                        );
                        ctx.font = `${itemSize}px JetBrains Mono`;
                        ctx.fillStyle = "black";
                        ctx.fillText(
                            amount.toString(),
                            rx,
                            ry
                        );
                    }
                }
            }
        }
    }

    function input() {
        let keysChanged = false;
        if (lastKeys.size !== $keys.size) {
            keysChanged = true;
        }
        for (let key of lastKeys) {
            if (!$keys.has(key)) {
                keysChanged = true;
            }
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
        }
        for (let button of lastMouseButtons) {
            if (!$mouseButtons.has(button)) {
                mouseButtonsChanged = true;
            }
        }

        if (mouseButtonsChanged) {
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

        if (containerType) {
            let cellX = null;
            let cellY = null;
            for (let [x, y, sx, sy, ex, ey] of containerBoundaries) {
                if ($mouseX < sx || $mouseX > ex) {
                    continue;
                }
                if ($mouseY < sy || $mouseY > ey) {
                    continue;
                }
                cellX = x;
                cellY = y;
            }

            let result = 0;
            if (cellY != null) {
                let containerName = containerNames[containerType];
                let containerWidth = containerWidths[containerName];
                result = 1 + cellX + cellY * containerWidth;
            }
            let cellBytes = new Uint8Array(2);
            cellBytes[0] = 67; // C or cell
            cellBytes[1] = result;
            return cellBytes;
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
        
        if (mousePosChanged && containerType == 0) {
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
        conn.send("ready");

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
