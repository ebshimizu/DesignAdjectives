// node integration for the substance automation toolkit
// specialized for the parameter editor interface
import path from 'path';
import cp, { exec } from 'child_process';
import fs from 'fs-extra';
// import fs from 'fs-extra';

// Fill in path with your toolkit dir
const tkDir = 'C:/Program Files/Allegorithmic/Substance Automation Toolkit';
const renderDir = './sbsRender';
const sbsmutator = path.join(tkDir, 'sbsmutator');
const sbsrender = path.join(tkDir, 'sbsrender');

let currentFile = '';
let params = [];

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

    console.log(params);
  } catch (e) {
    console.log(e);
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
    if (params[i].type === 'FLOAT3') {
      if (!collectedParams[params[i].parent])
        collectedParams[params[i].parent] = [];

      collectedParams[params[i].parent].push(vec[i]);
    } else {
      collectedParams[params[i].name] = `${params[i].name}@${vec[i]}`;
    }
  }

  // resolve FLOAT3 (color)
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

function render(canvasTarget, state, fileID) {
  // state is a vector
  const args = getRenderArgs(state);

  // call the render function
  exec(
    `"${sbsrender}" render ${args.join(
      ' '
    )} --set-value $outputsize@8,8 --output-name "${fileID}_{outputNodeName}" --output-path ${renderDir} "${currentFile}"`,
    function(err) {
      if (err) {
        console.log(err);
      } else {
        // files are there, check them
        // there's a lot tho so like... print the diffuse for now?
        // uhhhhhhh read the file
        const img = new Image();
        img.src = path.join(
          renderDir,
          `${fileID}_diffuse.png?${new Date().getTime()}`
        );
        img.onload = function() {
          canvasTarget.width = 256;
          canvasTarget.height = 256;

          const ctx = canvasTarget.getContext('2d');
          ctx.drawImage(img, 0, 0);
        };
      }
    }
  );
}

export default {
  loadNew(config) {
    fs.emptyDirSync(renderDir);
    currentFile = path.join(config.dir, config.filename);

    // load params
    loadParams(currentFile);
  },

  getParams() {
    return params;
  },

  setParam(id, val, _) {
    params[id].value = val;
  },

  setAllParams(vec) {
    const keys = Object.keys(params);
    for (let i = 0; i < vec.length; i++) {
      params[keys[i]].value = vec[i];
    }
  },

  async renderer(canvasTarget, settings) {
    // this might... get complicated.
    const state =
      'state' in settings ? settings.state : params.map(p => p.value);

    render(canvasTarget, state, settings.instanceID);
  }
};
