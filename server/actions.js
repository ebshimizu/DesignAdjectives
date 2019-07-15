const ACTION = {
  CONNECT: 'connect', // core socket.io
  DISCONNECT: 'disconnect',
  ACTION: 'action', // relay to snippet server
  GET_TYPE: 'getType',
  SINGLE_SAMPLE: 'single sample',
  SAMPLER_COMPLETE: 'sampler complete',
  SET_PARAM_INFO: 'set param info'
};

const GP_ACTION = {};

exports.ACTION = ACTION;
exports.GP_ACTION = GP_ACTION;
