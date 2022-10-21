import http from "http"
import url from "url"
import path from "path"
import fs from "fs"

const port = process.argv[2] || 8080;

http.createServer(function(request, response) {

    const uri = url.parse(request.url).pathname
    let filename = path.join(process.cwd(), uri)

    const contentTypesByExtension = {
        '.html': "text/html",
        '.css':  "text/css",
        '.js':   "text/javascript",
        '.json':  "application/json"
    };

    fs.access(filename, function() {
        
        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
        if(err) {        
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();
            return;
        }

        const headers = {};
        const contentType = contentTypesByExtension[path.extname(filename)];
        if (contentType) headers["Content-Type"] = contentType;
        response.writeHead(200, headers);
        response.write(file, "binary");
        response.end();
        });
    });
}).listen(parseInt(port, 10));

console.log("Static file server running at: http://localhost:" + port + "");