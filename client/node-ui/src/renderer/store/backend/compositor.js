// all functions here are required for compatibility with the parameter-store
// file. This file should serve as the template for implementing additional backends.

const compositor = require('../../../../node-compositor/build/Release/compositor');

compositor.setLogLevel(1);

let c = new compositor.Compositor();

// Helpers for the compositor function
function drawImage(image, canvas) {
  // canvas size should be set by image
  canvas.width = image.width();
  canvas.height = image.height();

  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var imDat = ctx.getImageData(0, 0, canvas.width, canvas.height);
  image.writeToImageData(imDat);

  createImageBitmap(imDat).then(function(imbit) {
    ctx.drawImage(imbit, 0, 0, canvas.width, canvas.height);
  });
}

function renderPromise(context, size) {
  return new Promise((resolve, reject) => {
    c.asyncRenderContext(context, size, function(err, img) {
      if (err) reject(new Error('Failed to render image'));

      resolve(img);
    });
  });
}

export default {
  type() {
    return '2D Compositor';
  },

  // config may have additional fields, would recommend adding to the object
  // as additional backends get constructed.
  loadNew(config) {
    // load settings too, eventually

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

  setAllParams(vec) {
    c.setContext(c.contextFromVector(vec));
  },

  // the render function. at minimum this takes a canvas target and a set of render settings.
  // render settings should attempt to be mostly consistent, but i suspect this might cause some
  // problems eventually.
  // this is an async function
  async renderer(canvasTarget, settings) {
    const size = 'size' in settings ? settings.size : 'full';
    const state =
      'state' in settings && settings.state.length > 0
        ? c.contextFromVector(settings.state)
        : c.getContext();

    try {
      const img = await renderPromise(state, size);
      drawImage(img, canvasTarget);
    } catch (e) {
      console.log(e);
    }
  },

  getSettings() {
    return {};
  },

  setSetting(key, value) {
    // noop
    // don't forget to snapshot settings
  }
};
