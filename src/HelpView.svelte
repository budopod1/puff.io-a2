<script>
    import HelpArticle from "./HelpArticle.svelte";
    import Header from "./Header.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function exitHelp() {
        dispatch("exitHelp");
    }
</script>

<main>
    <Header/>
    <a href="#" on:click={exitHelp} class="back">Back</a>
    <article>
        <HelpArticle/>
    </article>
</main>


<style>
    article {
        margin: 1rem;
        margin-top: 0;
        overflow: auto;
    }

    main {
        overflow: auto;
        height: 100%;
        position: relative;
    }

    .back {
        position: fixed;
        top: 1rem;
        right: 2rem;
        background-color: white;
        border: solid 1px black;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
    }
</style>
