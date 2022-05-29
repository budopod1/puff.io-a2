import { decode } from "./shortsocket.js";


export class Connection {
    constructor() {
        this.conn = null;
        this.onpacket = (data) => {};
        this.onstatus = (data) => {};
        this.onconnect = () => {};
    }

    connect(addr) {
        this.conn = new WebSocket(addr);

        let connection = this;
        this.conn.onmessage = (e) => {
            connection.message(e.data);
        };
        this.conn.onopen = () => {
            connection.onconnect();
        };
    }

    send(message) {
        this.conn.send(message);
    }

    message(data) {
        let connection = this;
        if (data instanceof Blob) {
            let result = "";
            let reader = data.slice(1).stream().getReader();
            reader.read().then(function processText({ done, value }) {
                if (done) {
                    let bytes = [];
                    for (let byte of result.split(",")) {
                        bytes.push(parseInt(byte));
                    }
                    connection.onpacket(decode(bytes));
                    return;
                }
                
                result += value;
                return reader.read().then(processText);
            });
        } else {
            this.onstatus(JSON.parse(data.slice(1)));
        }
    }
}
