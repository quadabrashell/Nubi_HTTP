import * as path from 'path'
import * as domain from 'domain'
import Console from './Console'
import Server from './Server'

// Get arguments
let args: any[] = Console.getArguments()
// Check required args
if (!args['port'] || !args['path']) {
    console.error('Bad start. Use "port" and "path" arguments to configure server.')
    process.exit(0)
}

// Server wrapper
let serverDomain = domain.create()
// Run server in wrapper
serverDomain.run(() => new Server(args['port'], args['path']))
// On server error
serverDomain.on('error', err => Console.error('server', 500, err))
