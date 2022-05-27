<script>
    import { world } from "./state.js"
	import { onMount } from 'svelte';
    import { render } from "./render.js";
    import { update } from "./game.js";
    import { getContext } from 'svelte';

    let conn = getContext('connection');
    conn.onpacket = (packet) => {
        update($world, packet);
    };
    
    let canvas;
    let ctx;
    let width;
    let height;
    let animationFrame;
    $: if (canvas) canvas.width = width;
    $: if (canvas) canvas.height = height;

    function frame() {
        animationFrame = requestAnimationFrame(frame);
        render($world, ctx, width, height);
    }
    
    onMount(() => {
		ctx = canvas.getContext('2d');
        animationFrame = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(animationFrame);
		};
    });
</script>

<canvas 
    bind:this={canvas}
></canvas>

<svelte:window 
    bind:innerWidth={width} 
    bind:innerHeight={height}
/>
