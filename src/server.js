import http from "http"
import url from "url"
import path from "path"
import fs from "fs"
import child_process from 'child_process'

const port = process.argv[2] || 8080;

http.createServer(function(request, response) {
    const uri =  request.url 
    let filename = path.join(process.cwd(), uri)
    const contentTypesByExtension = {
        '.html': "text/html",
        '.css':  "text/css",
        '.js':   "text/javascript",
        '.json':  "application/json"
    };
    if (request.url === '/src/update' && request.method === 'POST') {
        const res = response.req
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            const config = `export default ${chunk}`
            fs.writeFile('src/v-ast.config.js', config, (res) => {
                child_process.exec('rm build/*')
                child_process.exec('v-ast build', async (error) => {
                    if (error) { 
                        console.error('ERROR', error)
                        response.write(JSON.stringify({status: 500, data: 'ERROR'}));
                        response.end();
                    }
                    else {
                        const dt = new Date()
                        const {default: data} = await import(`../build/entrypoints.v-ast.js?${dt.getMilliseconds()}`)
                        response.write(JSON.stringify(data));
                        response.end();
                    }
                })
            })
        });
    }
    else if (request.url === '/src/close' && request.method === 'POST') {
        child_process.exec(`osascript -e 'quit app "vast"'`)
    }
    else {
        fs.access(filename, function() {
        
            if (fs.statSync(filename).isDirectory()) filename += 'src/index.html';
    
            fs.readFile(filename, "binary", function(err, file) {
                if(err) {        
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }

                if (filename.includes('index.html')) {

                    const config = fs.readFileSync(path.join(process.cwd(), 'src/templates/config.htmv'), 'utf8')
                    const galaxy = fs.readFileSync(path.join(process.cwd(), 'src/templates/galaxy.htmv'), 'utf8')

                    const html = file.split('<!-- content -->')
                    const head = html[0]
                    const foot = html[1]
                    file = `${head}
                    ${config}
                    ${galaxy}
                    ${foot}`
                }
    
                const headers = {};
                const contentType = contentTypesByExtension[path.extname(filename)];
                if (contentType) headers["Content-Type"] = contentType;
                response.writeHead(200, headers);
                response.write(file, "binary");
                response.end();
            });
        });
    }

    
}).listen(parseInt(port, 10));

console.log("Static file server running at: http://localhost:" + port + "");

console.log(import.meta.url)

// TODO: switch for different OS and browsers
child_process.exec(`sh ./src/browser.sh`)