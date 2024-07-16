import WebSocket, { WebSocketServer } from 'ws';
import http, { IncomingMessage } from 'http';
import url from 'url';

const createWebSocketProxyServer = (port: number) => {
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage, targetPort: string) => {
    const targetWs = new WebSocket(`ws://localhost:${targetPort}`);

    ws.on('message', (message: WebSocket.RawData) => {
      console.log(`[DEBUG ${targetPort}] - ws message`);
      if (targetWs.readyState === targetWs.CONNECTING) {
        console.log('[DEBUG ] CONNECTING');
        targetWs.addEventListener('open', e => {
          console.log(`[DEBUG ${targetPort}] - ws message`);
          console.log('[DEBUG ] CONNECTED - HAHAHAH JENVOI');
          targetWs.send(message);
        });
      } else {
        console.log('[DEBUG ] NOT CONNECTING ;)');
        targetWs.send(message);
      }
    });

    targetWs.on('message', (message: WebSocket.RawData) => {
      console.log(`[DEBUG ${targetPort}] - targetWs message`, message);
      ws.send(message, err => {
        console.log(`[DEBUG ${targetPort}] - ERROR WHEN SENDING MSG ${err?.message}`);
      });
    });

    ws.on('close', () => {
      console.log(`[DEBUG ${targetPort}] - ws close`);
      targetWs.close();
    });

    targetWs.on('close', () => {
      console.log(`[DEBUG ${targetPort}] - targetWs close`);
      ws.close();
    });

    ws.on('error', () => {
      console.log(`[DEBUG ${targetPort}] - ws error`);
      targetWs.close();
    });

    targetWs.on('error', () => {
      console.log(`[DEBUG ${targetPort}] - targetWs error`);
      ws.close();
    });
  });

  server.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
    const { pathname } = url.parse(request.url!);
    const match = pathname?.match(/^\/ws\/(\d+)\/(.+)$/);

    if (match) {
      const targetPort = match[1];
      const connectionId = match[2];
      const targetUrl = `${targetPort}/connection/${connectionId}`;
      console.log(`[DEBUG ${targetPort}] - target url is ${targetUrl}, pathanem is ${pathname}`);
      wss.handleUpgrade(request, socket, head, ws => {
        console.log(`[DEBUG ${targetPort}] - HANDLE UPGRADE`);
        wss.emit('connection', ws, request, targetUrl);
      });
    } else {
      console.log('[DEBUG] - DESTROY SOCKET BECAUSE NO MATCH');
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`WebSocket proxy server is listening on port ${port}`);
  });

  return server;
};

export default createWebSocketProxyServer;
