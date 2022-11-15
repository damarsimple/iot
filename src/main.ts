import { Board, Led, Pin, } from "johnny-five"
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

const board = new Board({
    'port': '/dev/ttyUSB0',
    repl: false,
});



const app = express();

app.use(express.static('public',));

app.use(express.json());


app.get('/led/:pin/state', async (req, res) => {
    const { pin } = req.params;
    const pinV = new Pin(pin);

    const promise = new Promise<number>((resolve, reject) => {
        pinV.read((err, state) => {
            if (err) {
                reject(err);
            }
            resolve(state);
        });
    });

    return res.json({
        state: promise
    })

})

app.post('/led/:pin/toggle', async (req, res) => {
    const { pin } = req.params;

    const pinV = new Pin(pin);
    pinV.read((err, v) => {
        if (err) {
            return res.json({ error: err });
        } else {
            pinV.write(v ? 0 : 1);
            return res.json({
                message: 'OK'
            })
        }

    });

})

app.post('/led/:pin/set', async (req, res) => {
    const { pin } = req.params;
    const { value } = req.body;
    const pinV = new Pin(pin);
    pinV.write(value);
    return res.json({
        message: 'OK',
        state: value
    })

})
const server = http.createServer(app);
const io = new Server(server);
board.on("ready", () => {
    console.log('board server')

    const sockets = [] as Socket[];

    io.on('connection', (socket) => {
        console.log('a user connected');
        sockets.push(socket);
    });

    const analog = new Pin('A0');

    analog.on('data', (value) => {
        sockets.forEach(socket => {
            socket.emit('analog-reading', value);
        })
    });


    server.listen(4000, () => {
        console.log('4000 ready server')
    })
})

