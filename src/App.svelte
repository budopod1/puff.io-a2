<script>
    import { assets, keys, mouseX, mouseY, mouseButtons, mouseWheel } from "./globals.js";
    import { setContext, onMount } from 'svelte';
    import GameView from "./GameView.svelte";
    import LoginView from "./LoginView.svelte";
    import SignupView from "./SignupView.svelte";
    import HelpView from "./HelpView.svelte";

    // Load the assets
    const assetNames = ["puff.png", "grass.png", "stone.png", "leaves.png", "wood.png", "flowers.png", "planks.png", "sapling.png", "mango.png", "cell.png", "trader1.png", "trader1stall.png", "empty.png", "arrow.png", "iron.png", "drill1.png", "drill2.png", "wind1.png", "wind2.png", "zombie.png", "hatch.png"];
     
    const loadedAssets = {};
    let messages = [];
    let page = "";
    let contesting = true;

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

    window.onmessage = (e) => {
        if (e.origin != "https://backend.puffio.repl.co") {
            return;
        }
        tryConnect();
        contesting = false;
    }

    document.onmousemove = (e) => {
        $mouseX = e.offsetX;
        $mouseY = e.offsetY;
    }

    function tryConnect() {
        if (conn) {
            if (conn.readyState == 0 || conn.readyState == 1) {
                return;
            }
            conn.close();
        }
        conn = new WebSocket("wss://backend.puffio.repl.co/ws");
        conn.binaryType = "arraybuffer";

        conn.onmessage = (e) => {
            if (page == "login" || page == "signup") {
                let data = JSON.parse(e.data.slice(1));
    
                if (data.success) {
                    conn.send("ready");
                    page = "game";
                } else {
                    messages = [
                        ...messages,
                        data.message
                    ];
                }
            }
        };
    }

    onMount(() => {
        for (let assetName of assetNames) {
            let imageURL = new URL("assets/" + assetName, import.meta.url).href;
            let assetImage = new Image();
            assetImage.src = imageURL;
            assetImage.onload = () => {
                loadedAssets[assetName] = assetImage;
                assets.set(loadedAssets);
            }
        }

        page = "login";
         // TODO: check if connection succeeded
    
        // conn.onopen = () => {
        //     page = "game";
        // };

        tryConnect();
    });

    function switchPage(newPage) {
        page = newPage;
        messages = [];
    }
</script>
<!-- data:text/html,<script>d=document;d.onkeydown=e=>d.body.innerText=e.keyCode</script> -->

<main>
    {#if page == ""}
        loading...
    {:else if page == "game"}
        <GameView/>
    {:else if page == "login"}
        <LoginView 
            on:switchPage="{()=>{switchPage('signup')}}" 
            on:getHelp="{()=>{switchPage('help')}}" bind:messages/>
    {:else if page == "signup"}
        <SignupView on:switchPage="{()=>{switchPage('login')}}" 
            on:getHelp="{()=>{switchPage('help')}}" bind:messages/>
    {:else if page == "help"}
        <HelpView on:exitHelp="{()=>{switchPage('login')}}"/>
    {/if}

    {#if contesting}
        <iframe title="Go away svelte A11Y checker" src="https://backend.puffio.repl.co/contest"></iframe>
    {/if}
</main>
<style>
    main {
        overflow: hidden;
        height: 100vh;
        width: 100vw;
    }

    iframe {
        display: none;
    }
</style>
