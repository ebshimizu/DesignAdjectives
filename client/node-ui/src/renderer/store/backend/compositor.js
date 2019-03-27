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
  },

  // given: parameter id, value to set to, current state object for the element
  // It is up to the backend driver to determine how it would
  // like to perform the update.
  setParam(id, val, _) {
    const vec = c.getContext().layerVector(c);
    vec[id] = val;
    c.setContext(c.contextFromVector(vec));
  },

  // the render function. at minimum this takes a canvas target and a set of render settings.
  // render settings should attempt to be mostly consistent, but i suspect this might cause some
  // problems eventually
  renderer(canvasTarget, settings) {
    // this right now is a nullop
    console.log('render trigger');
  }
};
