const winston = require('winston');
const { spawn } = require('child_process');
const { format } = require('logform');
const process = require('process');
const args = require('minimist')(process.argv.slice(2), {
  default: {
    python: 'python3',
    detached: false,
    port: 5234
  }
});

const { ACTION } = require('./actions');

const io = require('socket.io')(args.port);

const alignedWithColorsAndTime = format.combine(
  format.colorize(),
  format.timestamp(),
  format.align(),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: alignedWithColorsAndTime,
      level: 'debug'
    }),
    new winston.transports.File({ filename: 'warn.log', level: 'warn' }),
    new winston.transports.File({ filename: 'combined.log', level: 'silly' })
  ]
});

logger.info(
  `Attempting to initialize Design Snippets Server on port ${args.port}`
);

if (!args.detached) {
  // spawn child process for server
  const snippetServer = spawn(args.python, ['./dsServer.py']);
  snippetServer.stdout.on('data', data => {
    console.log(`${data}`);
  });
  snippetServer.on('close', code => {
    logger.info(`Snippet Server closed with code ${code}`);
  });
}

var snippetSocket;

// parameters have the following fields:
// name, type, value (current, not relevant for this), min, max, id (usually an index)
var paramInfo = [];

logger.info('Initializing socket.io');

io.on(ACTION.CONNECT, function(socket) {
  logger.info(`connection from ${socket.id}`);

  if (!snippetSocket) {
    socket.emit('no server');
  } else {
    socket.emit('server ok');
  }

  // determine if client or server connected
  socket.emit(ACTION.GET_TYPE, function(type) {
    if (type === 'server') {
      if (!snippetSocket) {
        snippetSocket = socket;
        logger.info(`Design Snippets Server found. id: ${socket.id}`);
        io.sockets.emit('server ok');
      } else {
        logger.error('Server already connected. Disconnect other server first');
      }
    }
  });

  socket.on(ACTION.DISCONNECT, function() {
    if (snippetSocket && snippetSocket.id === socket.id) {
      snippetSocket = null;
      logger.warn('Snippet server disconnected');
      io.sockets.emit('no server');
    }

    logger.info(`disconnect: ${socket.id}`);
  });

  socket.on(ACTION.ACTION, function(data, clientCB) {
    if (snippetSocket) {
      logger.log(
        'verbose',
        'Relaying action "%s". Args: %j.',
        data.fn,
        data.args
      );

      // inject parameter info into args
      if (data.args) {
        data.args.paramInfo = paramInfo;
      }

      snippetSocket.emit(data.fn, data.args, function(err, result) {
        logger.log('verbose', 'Relayed action returned %j', result);
        clientCB(err, result);
      });
    } else {
      logger.warn('Unable to process action. No snippet server connected');
    }
  });

  socket.on(ACTION.SINGLE_SAMPLE, function(data) {
    logger.info(`Relaying sample from ${data.name}`);
    io.sockets.emit('single sample', data.data, data.name);
  });

  socket.on(ACTION.SAMPLER_COMPLETE, function(data) {
    logger.info(`Relaying final sample data from ${data.name}`);
    io.sockets.emit('sampler complete', data.data, data.name);
  });

  // parameter management bindings
  socket.on(ACTION.SET_PARAM_INFO, function(params) {
    paramInfo = params;
    logger.info(`Server parameter info cache updated: ${paramInfo}`);
  });
});

logger.info('Initialized Design Snippets relay server on port 5234');
