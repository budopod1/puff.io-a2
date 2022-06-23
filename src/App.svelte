<script>
    import { assets, Connection, keys } from "./game.js";
    import { setContext, onMount } from 'svelte';
    import GameView from "./GameView.svelte";
    import WaitingView from "./WaitingView.svelte";

    // Load the assets
    let assetNames = ["puff.png", "grass.png", "stone.png", "leaves.png", "wood.png"];
    let loadedAssets = {};
    let page = "waiting";

    for (let assetName of assetNames) {
        let imageURL = new URL("assets/" + assetName, import.meta.url).href;
        let assetImage = new Image();
        assetImage.src = imageURL;
        assetImage.onload = () => {
            loadedAssets[assetName] = assetImage
            assets.set(loadedAssets);
        }
    }

    // Connect to the server
    let conn = new Connection();

    setContext('connection', conn);

    conn.onstatus = (data) => {
        if (data.action == "connect") {
            page = "game";
        }
    };

    conn.onconnect = () => {
        conn.send("connect");
    }

    onMount(() => {
        conn.connect("wss://backend.puffio.repl.co/ws");
    });

    // Add keydown listeners
    window.onkeydown = (e) => {
        $keys.add(e.keyCode);
    }

    window.onkeyup = (e) => {
        $keys.delete(e.keyCode);
    }
</script>
<!-- // data:text/html,<script>d=document;d.onkeydown=e=>d.body.innerText=e.keyCode</script> -->

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
