function zip(arrays) { // Modified from https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
    return arrays[0].map(
        (_, i) => arrays.map(array => array[i])
    );
}


export function update(world, packet) {
    // Maybe add entity & tile data?
    let [tile_xs, tile_ys, tile_types, entity_xs, entity_ys, entity_types] = packet;

    for (let [tile_x, tile_y, tile_type] of zip([tile_xs, tile_ys, tile_types])) {
        world["tilemap"][`(${tile_x}, ${tile_y})`] = {
            x: tile_x,
            y: tile_y,
            type: tile_type
        };
    }

    for (let [entity_x, entity_y, entity_type] of zip([entity_xs, entity_ys, entity_types])) {
        world["entities"][`(${entity_x}, ${entity_y})`] = {
            x: entity_x,
            y: entity_y,
            type: entity_type
        };
    }

    window["world"] = world;
    
    return world;
}
