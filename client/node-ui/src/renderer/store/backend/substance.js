// node integration for the substance automation toolkit
// specialized for the parameter editor interface
import path from 'path';
import cp, { exec } from 'child_process';
import fs from 'fs-extra';
import * as THREE from 'three';
import Settings from 'electron-settings';
import process from 'process';

// Fill in path with your toolkit dir
let tkDir = 'C:/Program Files/Allegorithmic/Substance Automation Toolkit';
const userFolder =
  process.env.APPDATA ||
  (process.platform === 'darwin'
    ? process.env.HOME + 'Library/Preferences'
    : process.env.HOME + '/.local/share');
const renderDir = path.join(userFolder, 'parameter-toolbox', 'sbsRender');

// initialize render directory
try {
  console.log(`Initializing render cache folder at ${renderDir}`);
  fs.ensureDirSync(renderDir);
} catch (e) {
  console.log(`Error: Unable to create render cache folder. ${e}`);
}

let sbsmutator = path.join(tkDir, 'sbsmutator');
let sbsrender = path.join(tkDir, 'sbsrender');

let currentFile = '';
let params = [];
let renderers = {};

let mesh = new THREE.SphereGeometry(10, 128, 128);
const threeLoader = new THREE.TextureLoader();

let renderer2D = null;
let renderLoopActive = false;

const renderQueue = [];
let activeRenders = 0;

const substanceSettings = {
  rotate: {
    type: 'boolean',
    value: true,
    name: 'Rotate Model'
  },
  rotateSpeed: {
    type: 'number',
    value: 0.01,
    name: 'Rotation Speed',
    min: 0,
    max: 0.1,
    step: 0.001
  },
  modelType: {
    type: 'enum',
    value: 'sphere',
    values: ['sphere', 'box', 'torus', 'knot', 'cylinder'],
    name: 'Model'
  },
  maxRenderThreads: {
    name: 'Max Render Threads',
    type: 'number',
    value: 8,
    min: 1,
    max: 64,
    step: 1
  },
  toolkitDir: {
    type: 'string',
    value: tkDir,
    readOnly: true,
    folderBrowser: true,
    name: 'Substance Automation Toolkit Location'
  },
  renderDir: {
    type: 'string',
    value: renderDir,
    readOnly: true,
    name: 'Texture Cache Folder (Read Only)'
  }
};

// load backend settings on script load
const loadedInitSettings = Settings.get('substanceBackendSettings');
if (loadedInitSettings) {
  for (const key in loadedInitSettings) {
    if (key in substanceSettings) {
      setSettingGlobal(key, loadedInitSettings[key].value);
    }
  }
}

function checkRenderQueue() {
  console.log(`Queue Length: ${renderQueue.length}`);
  // need to check for deadlock?
  if (
    activeRenders < substanceSettings.maxRenderThreads.value &&
    renderQueue.length > 0
  ) {
    activeRenders += 1;
    runJob(renderQueue.pop());
  }
}

function runJob(job) {
  // node threads are single threaded, so these should be atomic ops.
  job();
}

function queueJob(job) {
  console.log(`Queue length: ${renderQueue.length}`);
  if (activeRenders < substanceSettings.maxRenderThreads.value) {
    activeRenders += 1;
    runJob(job);
  } else {
    renderQueue.push(job);
  }
}

/**
 * Adds link ids to parameters that share parents.
 * Specific to substance. This automatically links vector3 and 4 parameters together.
 * This modification occurs in place.
 * @param {Object[]} data
 */
function linkParams(data) {
  for (let id = 0; id < data.length; id++) {
    // for each parameter
    const param = data[id];
    data[id].links = [];

    // that has a parent
    if (param.parent) {
      // find all other params that have the same parent and snapshot the ids
      data[id].links = data
        .filter(p => p.parent === param.parent)
        .map(p => p.id);
    }
  }
}

function loadParams(file) {
  // text parsing fun!
  try {
    const paramText = cp
      .execSync(`"${sbsmutator}" info --print-input-parameters ${file}`)
      .toString();

    // split based on INPUT as the key string
    params = [];
    const inputs = paramText.split('INPUT');

    // skip entry 1, it's always GRAPH-URL
    for (let i = 1; i < inputs.length; i++) {
      // split again based on '\n    ' (4 spaces);
      const settings = inputs[i].split('\n    ');

      // name and type
      const info = settings[0].split(' ');
      const name = info[1];

      if (name !== '$outputsize' && name !== '$randomseed') {
        const type = info[2].replace('\r', '');

        if (type === 'FLOAT3') {
          // color
          let defaults = [];
          for (let i = 1; i < settings.length; i++) {
            const setting = settings[i].split(' ');
            const settingName = setting[0];

            if (settingName === 'DEFAULT') {
              defaults = setting[1].split(',');
            }
          }

          const channels = ['r', 'g', 'b'];
          for (let j in channels) {
            const channel = channels[j];
            const cname = `${name}_${channel}`;

            params.push({
              name: cname,
              type,
              min: 0,
              max: 1,
              id: params.length,
              parent: name,
              value: parseFloat(defaults[j])
            });
          }
        }
        if (type === 'FLOAT4') {
          // color
          let defaults = [];
          for (let i = 1; i < settings.length; i++) {
            const setting = settings[i].split(' ');
            const settingName = setting[0];

            if (settingName === 'DEFAULT') {
              defaults = setting[1].split(',');
            }
          }

          const channels = ['r', 'g', 'b', 'a'];
          for (let j in channels) {
            const channel = channels[j];
            const cname = `${name}_${channel}`;

            params.push({
              name: cname,
              type,
              min: 0,
              max: 1,
              id: params.length,
              parent: name,
              value: parseFloat(defaults[j])
            });
          }
        } else if (type === 'BOOLEAN') {
          // skipping for now
          continue;
        } else {
          const param = {
            name,
            type,
            id: params.length
          };

          for (let j = 1; j < settings.length; j++) {
            const setting = settings[j].split(' ');
            const settingName = setting[0];

            if (settingName === 'DEFAULT') {
              param.value = parseFloat(setting[1]);
            } else if (
              settingName === 'MIN' ||
              settingName === 'MAX' ||
              settingName === 'STEP'
            ) {
              param[settingName.toLowerCase()] = parseFloat(setting[1]);
            }
          }

          if (!('min' in param)) param.min = 0;

          if (!('max' in param)) param.max = 1;

          params.push(param);
        }
      }
    }

    // gather info about linked params
    linkParams(params);

    console.log(params);
  } catch (e) {
    console.log(e);
  }
}

function updateMesh() {
  const type = substanceSettings.modelType.value;
  if (type === 'sphere') {
    mesh = new THREE.SphereGeometry(10, 128, 128);
  } else if (type === 'box') {
    mesh = new THREE.BoxGeometry(18, 18, 18);
  } else if (type === 'torus') {
    mesh = new THREE.TorusGeometry(10, 3, 32, 100);
  } else if (type === 'knot') {
    mesh = new THREE.TorusKnotGeometry(7, 2, 100, 32);
  } else if (type === 'cylinder') {
    mesh = new THREE.CylinderGeometry(10, 10, 10, 64, 64);
  }

  // update geometry in active renderers
  for (const k in renderers) {
    renderers[k].scene.remove(renderers[k].scene.getObjectByName('ref-object'));
    renderers[k].object = new THREE.Mesh(mesh, renderers[k].material);
    renderers[k].object.name = 'ref-object';
    renderers[k].scene.add(renderers[k].object);
  }
}

// takes the current parameters and returns a set of render arguments
function getRenderArgs(vec) {
  // collapse FLOAT3 params
  const collectedParams = {};
  for (let i = 0; i < vec.length; i++) {
    // identify, cache values
    // note that the float 3s should be in RGB order (that's the creation order)
    // so we can cache values here and combine
    if (params[i].type === 'FLOAT3' || params[i].type === 'FLOAT4') {
      if (!collectedParams[params[i].parent])
        collectedParams[params[i].parent] = [];

      collectedParams[params[i].parent].push(vec[i]);
    } else {
      collectedParams[params[i].name] = `${params[i].name}@${vec[i]}`;
    }
  }

  // resolve FLOAT3/FLOAT4 (color)
  for (let name in collectedParams) {
    if (Array.isArray(collectedParams[name])) {
      // collect
      collectedParams[name] = `${name}@${collectedParams[name].join(',')}`;
    }
  }

  // output argument array
  const args = [];
  for (let name in collectedParams) {
    args.push(`--set-value ${collectedParams[name]}`);
  }

  return args;
}

function render(canvasTarget, state, fileID, once) {
  // state is a vector
  const args = getRenderArgs(state);

  // call the render function
  exec(
    `"${sbsrender}" render ${args.join(
      ' '
    )} --set-value $outputsize@9,9 --output-name "${fileID}_{outputNodeName}" --output-path ${renderDir} "${currentFile}"`,
    function(err) {
      if (err) {
        console.log(err);
      } else {
        // files are there, check them and set three.js material parameters accordingly
        // if there is an existing renderer, we need to check that the canvas element
        // is still in the DOM. if not, we need to redo everything
        if (fileID in renderers) {
          if (!document.body.contains(renderers[fileID].renderer.domElement)) {
            // deleting the object should trigger a re-bind of the element.
            deleteRenderer(renderers[fileID]);
            delete renderers[fileID];
          }
        }

        let renderer = {};

        if (!(fileID in renderers)) {
          renderer = {
            scene: new THREE.Scene(),
            camera: new THREE.PerspectiveCamera(75, 1, 0.1, 1000),
            material: new THREE.MeshStandardMaterial({
              metalness: 1.0,
              roughness: 1.0,
              opacity: 1.0
            }),
            light: new THREE.DirectionalLight(0xffffff, 1)
          };

          // load a basic model
          renderer.object = new THREE.Mesh(mesh, renderer.material);
          renderer.object.name = 'ref-object';
          renderer.scene.add(renderer.object);
          renderer.scene.add(renderer.light);
          renderer.light.position.set(0, 0, 1);

          // update canvas sizes
          canvasTarget.width = 512;
          canvasTarget.height = 512;
          renderer.camera.position.z = 25;

          if (!once) {
            renderer.renderer = new THREE.WebGLRenderer({
              canvas: canvasTarget
            });

            renderer.renderer.setSize(
              canvasTarget.width,
              canvasTarget.height,
              false
            );

            renderers[fileID] = renderer;
          }
        } else {
          renderer = renderers[fileID];
        }

        // update the material properties
        const material = renderer.material;

        if (once) {
          loadThenDelete(renderer, material, fileID, canvasTarget);
        } else {
          loadContinuous(material, fileID);
        }
      }

      // this is the async part, check for render queue progress
      activeRenders -= 1;
      checkRenderQueue();
    }
  );
}

function deleteMaterialMaps(material) {
  material.map.dispose();
  material.metalnessMap.dispose();
  material.normalMap.dispose();
  material.roughnessMap.dispose();
  material.displacementMap.dispose();

  if (material.aoMap) material.aoMap.dispose();
}

function deleteRenderer(renderer) {
  deleteMaterialMaps(renderer.material);
  renderer.material.dispose();
  renderer.scene.dispose();

  if (renderer.renderer) {
    renderer.renderer.forceContextLoss();
    renderer.renderer.dispose();
  }
}

function promiseLoadTexture(url) {
  return new Promise((resolve, reject) => {
    threeLoader.load(url, resolve, reject);
  });
}

function loadThenDelete(renderer, material, id, destCanvas) {
  // welcome to hell (but like promisified)
  const textures = {
    map: path.join(renderDir, `${id}_diffuse.png?${new Date().getTime()}`),
    metalnessMap: path.join(
      renderDir,
      `${id}_metallic.png?${new Date().getTime()}`
    ),
    normalMap: path.join(renderDir, `${id}_normal.png?${new Date().getTime()}`),
    roughnessMap: path.join(
      renderDir,
      `${id}_roughness.png?${new Date().getTime()}`
    ),
    displacementMap: path.join(
      renderDir,
      `${id}_height.png?${new Date().getTime()}`
    )
  };

  if (fs.existsSync(path.join(renderDir, `${id}_ambientocclusion.png`))) {
    textures.aoMap = path.join(
      renderDir,
      `${id}_ambientocclusion.png?${new Date().getTime()}`
    );
  }

  const promises = Object.keys(textures).map(key => {
    return promiseLoadTexture(textures[key])
      .then(texture => {
        material[key] = texture;
      })
      .catch(function(error) {
        console.log(`Failed to load texture for ${key}`);
        console.error(error);
      });
  });

  Promise.all(promises)
    .then(() => {
      material.needsUpdate = true;

      renderer2D.render(renderer.scene, renderer.camera);

      // grab the canvas element, copy the pixels over
      const src = renderer2D.domElement.getContext('webgl');
      const dest = destCanvas.getContext('2d');

      dest.drawImage(src.canvas, 0, 0);
      deleteRenderer(renderer);
    })
    .catch(e => {
      console.log(e);
      deleteRenderer(renderer);
    });
}

function loadContinuous(material, id) {
  material.map = threeLoader.load(
    path.join(renderDir, `${id}_basecolor.png?${new Date().getTime()}`)
  );
  material.metalnessMap = threeLoader.load(
    path.join(renderDir, `${id}_metallic.png?${new Date().getTime()}`)
  );
  material.normalMap = threeLoader.load(
    path.join(renderDir, `${id}_normal.png?${new Date().getTime()}`)
  );
  material.roughnessMap = threeLoader.load(
    path.join(renderDir, `${id}_roughness.png?${new Date().getTime()}`)
  );
  material.aoMap = threeLoader.load(
    path.join(renderDir, `${id}_ambientocclusion.png?${new Date().getTime()}`)
  );
  material.displacementMap = threeLoader.load(
    path.join(renderDir, `${id}_height.png?${new Date().getTime()}`)
  );

  material.needsUpdate = true;
}

function updateRenders() {
  if (renderLoopActive) requestAnimationFrame(updateRenders);

  const prune = [];
  // we also should prune this for inactive canvases
  for (let id in renderers) {
    if (document.body.contains(renderers[id].renderer.domElement)) {
      if (substanceSettings.rotate.value === true) {
        renderers[id].object.rotation.x += substanceSettings.rotateSpeed.value;
      }

      renderers[id].renderer.render(renderers[id].scene, renderers[id].camera);
    } else {
      prune.push(id);
    }
  }

  for (const id of prune) {
    deleteRenderer(renderers[id]);
    delete renderers[id];
  }
}

function setSettingGlobal(key, value) {
  substanceSettings[key].value = value;

  if (key === 'modelType') {
    updateMesh();
  }

  Settings.set('substanceBackendSettings', substanceSettings);
}

export default {
  type() {
    return 'Substance';
  },

  setSetting(key, value) {
    setSettingGlobal(key, value);

    if (key === 'toolkitDir') {
      this.updateSATLocation(value);
    }
  },

  loadNew(config) {
    fs.emptyDirSync(renderDir);
    currentFile = path.join(config.dir, config.filename);

    // load backend settings
    const loadedSettings = Settings.get('substanceBackendSettings');
    if (loadedSettings) {
      for (const key in loadedSettings) {
        if (key in substanceSettings) {
          setSettingGlobal(key, loadedSettings[key].value);
        }
      }
    }

    // load params
    renderers = {};
    loadParams(currentFile);

    // rendering setup
    if (renderer2D) {
      renderer2D.forceContextLoss();
      renderer2D.dispose();
      renderer2D = null;
    }

    renderer2D = new THREE.WebGLRenderer();
    renderer2D.setSize(512, 512);

    if (!renderLoopActive) {
      renderLoopActive = true;
      updateRenders();
    }
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

  async renderer(canvasTarget, textTarget, settings) {
    // this might... get complicated.
    const state =
      'state' in settings ? settings.state : params.map(p => p.value);

    if (!settings.once) {
      // live updates always run immediately
      render(canvasTarget, state, settings.instanceID, settings.once);
    } else {
      // everything else gets stuck in a simple queue
      // in case I decide to throw 500 renders at the tool at once
      // (purely theoretical)
      queueJob(() =>
        render(canvasTarget, state, settings.instanceID, settings.once)
      );
    }
  },

  stopUpdateLoop() {
    renderLoopActive = false;
  },

  getSettings() {
    return substanceSettings;
  },

  updateSATLocation(newPath) {
    tkDir = newPath;
    sbsmutator = path.join(tkDir, 'sbsmutator');
    sbsrender = path.join(tkDir, 'sbsrender');
  }
};
