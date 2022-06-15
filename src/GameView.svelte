<script>
    import { assets, render, update, keys, input } from "./game.js";
	import { onMount } from 'svelte';
    import { getContext } from 'svelte';

    let conn = getContext('connection');
    let world = {"tilemap": {}, "entities": [], "player_x": 0, "player_y": 0};
    // let timer = new Timer();
    conn.onpacket = (packet) => {
        conn.send(input($keys));
        if (packet) {
            // console.log(packet);
            world = update(world, packet);
        }
        // timer.tick();
        // console.log(timer.fps);
        // conn.send(input($keys)); // Add keydown sending
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
            render($assets, world, ctx, width, height);
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
