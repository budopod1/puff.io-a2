<script>
    import Header from "./Header.svelte";
    
    export let username;
    export let password;
    export let messages;

    function disappear(node, { speed = 5 }) {
        setTimeout(() => {
            node.style.display = "none";
        }, speed * 1000);
    }
</script>

<div class="top">
    <div class="header"><Header/></div>
    <div class="title"><slot name="title"></slot></div>
    <div class="messages">
        {#each messages as message}
            <div class="message-holder" transition:disappear>
                <span class="message">{message}</span>
            </div>
        {/each}
    </div>
    <form class="body" on:submit|preventDefault>
        <small class="info">
            Username and password can only contain letters, numbers, and underscores
        </small>
        <div class="input">
            <label for="username">Username</label>
            <input id="username" bind:value={username} minlength="3" maxlength="20" pattern="\w*" required>
        </div>
        <div class="input">
            <label for="password">Password</label>
            <input id="password" bind:value={password} type="password" minlength="5" maxlength="50" pattern="\w*" required>
        </div>
        <button type="submit">Submit</button>
    </form>
    <div class="spacer-1"></div>
    <div class="switch">
        <slot name="switch"></slot>
    </div>
    <div class="spacer-2"></div>
    <div class="help">
        <slot name="help"></slot>
    </div>
    <div class="spacer-3"></div>
</div>

<style>
    .info {
        margin-bottom: 1rem;
        width: 50%;
        display: inline-block;
    }
    
    .top {
        height: 100%;
        display: grid;
        grid-template-columns: auto min(80ch, 100%) auto;
        grid-template-rows: auto auto auto auto 1fr auto 1fr auto 1fr;
        overflow: auto;
    }

    .header {
        grid-column: 1 / 3;
        grid-row: 1;
    }

    .title {
        grid-column: 2;
        grid-row: 2;
        text-align: center;
    }

    .messages {
        grid-column: 2;
        grid-row: 3;
        text-align: center;
        margin-bottom: 1rem;
    }

    .body {
        grid-column: 2;
        grid-row: 4;
        text-align: center;
    }

    .spacer-1 {
        grid-column: 2;
        grid-row: 5;
    }

    .switch {
        grid-column: 2;
        grid-row: 6;
        text-align: center;
        margin: 1rem 0;
    }

    .spacer-2 {
        grid-column: 2;
        grid-row: 7;
    }

    .help {
        grid-column: 2;
        grid-row: 8;
        text-align: center;
        margin: 1rem 0;
    }

    .spacer-3 {
        grid-column: 2;
        grid-row: 9;
    }

    .input {
        margin-bottom: 1rem;
    }

    button {
        font-family: 'JetBrains Mono', monospace; 
        /* no clue why this is required, but otherwise, a default font is used */

        background-color: #21a8de;
        border: none;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
    }

    button:hover {
        background-color: #23bcfa;
    }

    .message {
        border: solid 1px black;
        padding: 0.5rem;
        border-radius: 0.25rem;
    }

    .message-holder {
        margin: 1.5rem;
    }
</style>
