const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const cors = require('cors');

const app = express();
app.use(cors());

// Servir la carpeta actual (donde debe estar tu index.html)
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/term' });

// Determinar el intérprete de shell según el SO anfitrión (Bash preferiblemente)
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

wss.on('connection', (ws) => {
    console.log('Cliente conectado a la terminal (xterm.js)');

    // Crear un proceso aislado (PTY) por cada usuario/conexión
    // Si estás en producción, aquí es donde invocarías 'docker run -it bash' en lugar del shell host
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME || process.cwd(),
        env: process.env
    });

    // Leer la salida de Linux y enviarla al HTML
    ptyProcess.on('data', (data) => {
        ws.send(data);
    });

    // Leer teclas del HTML (xterm.js) y enviarlas a Linux
    ws.on('message', (msg) => {
        ptyProcess.write(msg.toString());
    });

    // Limpiar al desconectar
    ws.on('close', () => {
        console.log('Cliente desconectado');
        ptyProcess.kill();
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Servidor Laboratorio TAI corriendo en http://localhost:${PORT}`);
    console.log(`✅ Backend WebSocket PTY escuchando en ws://localhost:${PORT}/term`);
    console.log('Abre http://localhost:3000 en tu navegador para ver la aplicación.');
});
