#Use to create local host
import http.server
import socketserver

PORT = 80

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
      ".js": "application/javascript",
});

httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.serve_forever()