import { writable } from 'svelte/store';

export let page = writable("waiting");

export let world = writable({});
