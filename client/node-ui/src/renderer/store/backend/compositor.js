// all functions here are required for compatibility with the parameter-store
// file. This file should serve as the template for implementing additional backends.

const compositor = require('../../../../node-compositor/build/Release/compositor');

compositor.setLogLevel(1);

let c = new compositor.Compositor();

export const CompositorBackend = {
  // config may have additional fields, would recommend adding to the object
  // as additional backends get constructed.
  loadNew(config) {
    c = new compositor.Compositor(config.filename, config.dir);
  },

  // returns an array of available parameters.
  // parameters should include: name, current value, type (enum/float/etc.), min, max
  // and an id
  getParams() {
    const rawParams = JSON.parse(c.getContext().layerKey(c));
    const params = [];
    for (const p of rawParams) {
      params.push({
        name: `${p.layerName}:${p.adjustmentName}`,
        value: p.value,
        type: p.type,
        min: p.min,
        max: p.max,
        id: params.length
      });
    }

    return params;
  }
};
