import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.io.File;
import java.nio.file.Files;
import java.net.InetSocketAddress;

public class SimpleWebServer {
    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", new FileHandler());
        server.setExecutor(null); // creates a default executor
        System.out.println("Java Web Server started at http://localhost:" + port + "/");
        server.start();
    }

    static class FileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String path = t.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }
            
            // Security check: prevent directory traversal
            if (path.contains("..")) {
                sendError(t, 403, "Forbidden");
                return;
            }
            
            File file = new File("." + path);
            if (!file.exists() || file.isDirectory()) {
                sendError(t, 404, "404 Not Found");
            } else {
                String contentType = getMimeType(path);
                t.getResponseHeaders().set("Content-Type", contentType);
                t.sendResponseHeaders(200, file.length());
                try (OutputStream os = t.getResponseBody()) {
                    Files.copy(file.toPath(), os);
                }
            }
        }
        
        private String getMimeType(String path) {
            if (path.endsWith(".html") || path.endsWith(".htm")) return "text/html; charset=utf-8";
            if (path.endsWith(".css")) return "text/css; charset=utf-8";
            if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
            if (path.endsWith(".png")) return "image/png";
            if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
            if (path.endsWith(".gif")) return "image/gif";
            if (path.endsWith(".svg")) return "image/svg+xml";
            if (path.endsWith(".ico")) return "image/x-icon";
            return "application/octet-stream";
        }
        
        private void sendError(HttpExchange t, int code, String msg) throws IOException {
            t.sendResponseHeaders(code, msg.length());
            try (OutputStream os = t.getResponseBody()) {
                os.write(msg.getBytes());
            }
        }
    }
}
