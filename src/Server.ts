import * as http from 'http'
import * as fs from 'fs'
import * as url from 'url'
import * as path from 'path'
import * as domain from 'domain'
import Console from './Console'
import Awaiter from './Awaiter'
import Mime from './Mime'

export default class Server {
    req
    res
    wwwpath

    constructor(port: number, wwwpath: string) {
        this.wwwpath = wwwpath
        // Server
        let server = http.createServer((req, res) => {
            // Request wrapper
            let reqDomain = domain.create()
            // Set and wrap request vars
            reqDomain.add(this.req = req)
            reqDomain.add(this.res = res)
            // Processing request
            reqDomain.run(this.processRequest)
            // On request error
            reqDomain.on('error', err => {
                this.HttpError(500, err)
                return
            })
        })

        // Run server
        server.listen(port, () => Console.log('server', `Server running at ${port} port in ${wwwpath}`))
    }

    processRequest = async () => {
        let filePath

        // Check if url correct
        try {
            // Prepare file path
            filePath = decodeURIComponent(url.parse(this.req.url).pathname)
            if (~filePath.indexOf('\0') || ~filePath.indexOf('..')) throw new Error('Wrong path.')
            filePath = path.normalize(path.join(this.wwwpath, filePath))
        } catch (err) {
            this.HttpError(400, err)
            return
        }

        // Check if file exists
        try {
            let stats: fs.Stats = await Awaiter(fs.stat, filePath)
            if (!stats.isFile()) throw new Error('File is dir.')
        } catch(err) {
            this.HttpError(404, err)
            return
        }

        // Set MIME-type
        let ext = filePath.split('.').pop()
        let mimetype = Mime.getMimeType(ext)
        this.res.setHeader('Content-Type', mimetype)

        // Output
        let fstream:fs.ReadStream = fs.createReadStream(filePath)
        fstream.pipe(this.res)
        fstream.on('error', err => this.HttpError(500, err))
        fstream.on('close', () => Console.log('server', `[200] ${this.req.url}: OK`))

        // SLOWLORIS protection
        this.res.on('close', () => fstream.destroy())
    }

    private static StatusTable = {
        400: 'Bad Request',
        404: 'Not Found',
        500: 'Server Error'
    }

    private HttpError(statusCode: number, error: string): void {
        this.res.statusCode = statusCode
        this.res.end(Server.StatusTable[statusCode])
        Console.error('server', statusCode, `${this.req.url}: ${error}.`)
    }
}
