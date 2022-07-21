 <script>
    import { assets, keys, mouseX, mouseY, mouseButtons, mouseWheel } from "./globals.js";
    import { setContext, onMount } from 'svelte';
    import GameView from "./GameView.svelte";
    import WaitingView from "./WaitingView.svelte";

    // Load the assets
    const assetNames = ["puff.png", "grass.png", "stone.png", "leaves.png", "wood.png", "flowers.png", "cell.png", "trader1.png", "empty.png", "arrow.png", "iron.png", "drill1.png"];
     
    const loadedAssets = {};
    let page = "waiting";

    // Connect to the server
    let conn;
    setContext('connection', () => conn);

    // Add keydown listeners
    window.onkeydown = (e) => {
        $keys.add(e.keyCode);
    }

    window.onkeyup = (e) => {
        $keys.delete(e.keyCode);
    }

    window.onmousedown = (e) => {
        $mouseButtons.add(e.which);
    }

    window.onmouseup = (e) => {
        $mouseButtons.delete(e.which);
    }

    window.onwheel = (e) => {
        let movement = e.deltaX || e.deltaY || e.deltaZ || 0;
        $mouseWheel += movement;
    }

    document.onmousemove = (e) => {
        $mouseX = e.offsetX;
        $mouseY = e.offsetY;
    }

    onMount(() => {
        for (let assetName of assetNames) {
            let imageURL = new URL("assets/" + assetName, import.meta.url).href;
            let assetImage = new Image();
            assetImage.src = imageURL;
            assetImage.onload = () => {
                loadedAssets[assetName] = assetImage
                assets.set(loadedAssets);
            }
        }
        
        conn = new WebSocket("wss://backend.puffio.repl.co/ws");
        conn.binaryType = "arraybuffer";
    
        conn.onopen = () => {
            page = "game";
        };
    });
</script>
<!-- data:text/html,<script>d=document;d.onkeydown=e=>d.body.innerText=e.keyCode</script> -->

<main>
    {#if page == "game"}
        <GameView/>
    {:else if page == "waiting"}
        <WaitingView/>
    {:else if page == "login"}
        <LoginView/>
    {:else if page == "signup"}
        <SignupView/>
    {/if}
</main>
<style>
    main {
        overflow: hidden;
        height: 100vh;
        width: 100vw;
    }
</style>
