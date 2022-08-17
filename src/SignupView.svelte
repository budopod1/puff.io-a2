<script>
    import AccountForm from "./AccountForm.svelte";
    import { onMount, getContext, createEventDispatcher } from 'svelte';

    let getConn = getContext('connection');
    
    let username = "";
    let password = "";
    export let messages = [];

    const dispatch = createEventDispatcher();

    function signup() {
        getConn().send(`signup:${username},${password};`);
    }

    function switchPage() {
        dispatch("switchPage");
    }

    function getHelp() {
        dispatch("getHelp");
    }
</script>

<AccountForm bind:username bind:password on:submit={signup} bind:messages>
    <h2 slot="title">Sign Up</h2>
    <a slot="switch" href="#" on:click={switchPage}>
        I already have an account
    </a>
    <a slot="help" href="#" on:click={getHelp}>
        Puff.IO Guide
    </a>
</AccountForm>
