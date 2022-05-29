function _get_dtype(byte) {
    return [
        "array",
        "bool8",
        "int8",
        "int32",
        "float32",
        "snip"
    ][decode_int8(byte)];
}


function _add_at_level(data, level, item) {
    for (let i = 0; i < level; i++) {
        data = data[data.length - 1];
    }
    data.push(item);
}


function _get_step(dtype) {
    return {
        "int8": 1,
        "bool8": 1,
        "snip": 1,
        "int32": 4,
        "float32": 4,
        "array": 1
    }[dtype];
}


function decode_int8(data) {
    if (data < 2**7) {
        return -data;
    } else {
        return data - 2**7;
    }
}


function decode_int32(data) {
    let total = 0;
    for (let i = 0; i < 4; i++) {
        total += data[i] * 256**i;
    }
    if (total < 2**31) {
        return -total;
    } else {
        return total - 2**31;
    }
}


function decode_float32(data) {
    let buffer = new ArrayBuffer(4);
    let array = new DataView(buffer);
    let isAllFF = true;
    for (let i = 0; i < 4; i++) {
        array.setUint8(i, data[i]);
        if (data[i] != 255) {
            isAllFF = false;
        }
    }
    if (isAllFF) {
        return 0;
    }
    return array.getFloat32(0);;
}


function decode_bool8(data) {
    return decode_int8(data) == 1;
}


export function decode(data) {
    let i = 1;
    let dtype = _get_dtype(data[0]);
    let step = _get_step(dtype);
    let decoded = [];
    let level = 0;
    while (true) {
        let is_array = false;
        
        if (i >= data.length - 1) {
            break;
        }

        if (data[i] == 0x00) {
            level -= 1;
            dtype = "array";
            step = _get_step(dtype);
        } else if (dtype == "int8") {
            _add_at_level(decoded, level, decode_int8(data[i]));
        } else if (dtype == "bool8") {
            _add_at_level(decoded, level, decode_bool8(data[i]));
        } else if (dtype == "snip") {
            _add_at_level(decoded, level, data[i]);
        } else if (dtype == "int32") {
            _add_at_level(decoded, level, decode_int32(data.slice(i, 1+i+step)));
        } else if (dtype == "float32") {
            _add_at_level(decoded, level, decode_float32(data.slice(i, 1+i+step)));
        } else if (dtype == "array") {
            _add_at_level(decoded, level, []);
            level += 1;
            dtype = _get_dtype(data[i]);
            step = _get_step(dtype);
            i += 1;
            is_array = true;
        }
        if (!is_array) {
            i += step;
        }
    }
    return decoded;
}
