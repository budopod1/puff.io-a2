<script>
    import AccountForm from "./AccountForm.svelte";
    import { onMount, getContext, createEventDispatcher } from 'svelte';

    let getConn = getContext('connection');
    
    let username = "";
    let password = "";
    export let messages = [];

    const dispatch = createEventDispatcher();

    function login() {
        getConn().send(`login:${username},${password};`);
    }

    function switchPage() {
        dispatch("switchPage");
    }
</script>

<AccountForm bind:username bind:password on:submit={login} bind:messages>
    <h2 slot="title">Log In</h2>
    <a slot="switch" href="#" on:click={switchPage}>
        I need to create an account
    </a>
</AccountForm>

<style>
    a {
        color: blue;
    }
</style>
