import { decode } from "./shortsocket.js"


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
        if (data[0] == "S") { // This is a status event
            this.onstatus(JSON.parse(data.slice(1)));
        } else if (data[0] == "P") { // This is a gameplay packet
            this.onpacket(decode(data.slice(1))); // Fix dis
        }
    }
}
