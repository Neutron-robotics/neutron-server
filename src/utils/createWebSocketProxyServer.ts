import WebSocket, { WebSocketServer } from 'ws';
import http, { IncomingMessage } from 'http';
import url from 'url';

const createWebSocketProxyServer = (port: number) => {
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage, targetPort: string) => {
    const targetWs = new WebSocket(`ws://localhost:${targetPort}`);

    ws.on('message', (message: WebSocket.RawData) => {
      targetWs.send(message);
    });

    targetWs.on('message', (message: WebSocket.RawData) => {
      ws.send(message);
    });

    ws.on('close', () => {
      targetWs.close();
    });

    targetWs.on('close', () => {
      ws.close();
    });

    ws.on('error', () => {
      targetWs.close();
    });

    targetWs.on('error', () => {
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
      console.log('[DEBUG] target url is ', targetUrl, 'pathanem is ', pathname);
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request, targetUrl);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`WebSocket proxy server is listening on port ${port}`);
  });

  return server;
};

export default createWebSocketProxyServer;
