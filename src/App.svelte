<script>
    import { page } from "./state.js";
    import { Connection } from "./connection.js";
    import { setContext, onMount } from 'svelte';
    import GameView from "./GameView.svelte";
    import WaitingView from "./WaitingView.svelte";

    let conn = new Connection();

    setContext('connection', conn);

    conn.onstatus = (data) => {
        if (data.action == "connect") {
            $page = "game";
        }
    };

    conn.onconnect = () => {
        conn.send("connect");
    }

    onMount(() => {
        // conn.connect("wss://backend.puffio.repl.co");
    });
</script>

<main>
    {#if $page == "game"}
        <GameView/>
    {:else if $page == "waiting"}
        <WaitingView/>
    {:else if $page == "login"}
        <LoginView/>
    {:else if $page == "signup"}
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
