const tls = require('tls')

function parseHeader (header) {
  const code = parseInt(header.slice(0, 2), 10)
  const codeCategory = Math.floor(code / 10)
  const meta = header.slice(3)
  return { code, codeCategory, meta }
}

function makeRequest (urlString, cb) {
  const url = new URL(urlString)
  if (!url.port) url.port = 1965
  const socket = tls.connect(url.port, url.hostname, () => {
    socket.write(url.href + '\r\n')
  })

  socket.setEncoding('utf8')

  let header = ''
  let headerComplete = false
  let body = ''

  socket.on('data', (chunk) => {
    for (let i = 0; i < chunk.length; i++) {
      if (!headerComplete) {
        if (header[header.length - 1] === '\r' && chunk[i] === '\n') {
          headerComplete = true
        }
        header += chunk[i]
      } else {
        body += chunk[i]
      }
    }
  })

  socket.on('end', () => {
    // handle header
    const parsedHeader = parseHeader(header)
    switch (parsedHeader.codeCategory) {
      case 3: // redirect
        makeRequest(parsedHeader.meta, cb)
        break
      default:
        const error = ['1', '2', '3'].includes(header[0])
        cb(error ? header : null, { header, body })
    }
  })
}

function main (...args) {
  const [urlString] = args

  makeRequest(urlString, (err, { header, body }) => {
    console.error(header)
    console.error(body)
  })

}

main(...process.argv.slice(2))
