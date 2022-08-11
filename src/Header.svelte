<script>
    import puffURL from "./assets/puff.png";
</script>

<div>
    <img src={puffURL}>
    <h1>Puff.IO</h1>
</div>

<style>
    img {
        height: 2em;
        width: auto;
    }

    h1 {
        display: inline-block;
        margin: 0;
    }

    div {
        padding: 0.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
</style>