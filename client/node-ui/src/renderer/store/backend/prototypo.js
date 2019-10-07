// not sure if pytypo is available here?
let params = [];
// eslint-disable-next-line no-unused-vars
var Ptypo, prototypoFontFactory;

export default {
  type() {
    return 'Prototypo';
  },
  loadNew(config) {
    if (!Ptypo) {
      Ptypo = config.window.Ptypo;
      // eslint-disable-next-line new-cap
      prototypoFontFactory = new Ptypo.default(process.env.PTYPO_API_KEY);
    }

    // should load the template from the file
    // no params for dev stage yet
  },
  getParams() {
    return params;
  },
  setParam(id, val, _) {
    params[id].value = val;
  },
  setAllParams(vec) {
    for (let i = 0; i < vec.length; i++) {
      params[i].value = vec[i];
    }
  },
  async renderer(canvasTarget, textTarget, settings) {},
  getSettings() {
    return {};
  },
  setSetting(key, value) {
    // noop
  }
};
