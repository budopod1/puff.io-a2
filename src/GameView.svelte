<script>
    import { assets, world } from "./state.js"
	import { onMount } from 'svelte';
    import { render } from "./render.js";
    import { update } from "./game.js";
    import { getContext } from 'svelte';

    let conn = getContext('connection');
    conn.onpacket = (packet) => {
        $world = update($world, packet);
        // conn.send(""); // Add keydown sending
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
        animationFrame = requestAnimationFrame(frame);
        render($assets, $world, ctx, width, height);
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
