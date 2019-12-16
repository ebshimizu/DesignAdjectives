const fs = require('fs-extra');
const events = require('./actions');
const path = require('path');
const timeline = require('./timeline').timeline;

const ids = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
const tasks = ['task-1', 'task-2'];
const root = process.argv[2];

// svg setup
// returns a window with a document and an svg root node
const window = require('svgdom');
const document = window.document;
const { SVG, registerWindow } = require('@svgdotjs/svg.js');

const offsetInterval = 35;

// register window and document
registerWindow(window, document);

// console.log('Task\tsampling\thighlighting\tselection\textents\tgeneral\tmixer');

console.log('id\tglobal\tadjective\ttime');

let globTotal = 0;
let adjTotal = 0;
let timeTotal = 0;

for (const task of tasks) {
  // create canvas
  let offset = 5;
  let combined = SVG(document.documentElement);
  const times = {};
  const counts = {};

  for (let i = 0; i < 14; i++) {
    combined
      .line(i * 60, 0, i * 60, offsetInterval * 10 + 5)
      .stroke({ width: 1, color: 'black' });
  }

  for (const id of ids) {
    const log = path.join(root, id, task, 'actions.log');
    const out = path.join(root, id, task, 'timeline.svg');
    // console.log(`Reading ${log}...`);

    const logData = fs.readFileSync(log).toString();
    const logLines = logData.split('\n');
    logLines.pop();
    const logEvents = logLines.map(s => JSON.parse(s));

    const used = {
      sampling: false,
      highlighted: false,
      selection: false,
      extents: false,
      general: false,
      mixer: false
    };

    const actionGroups = {
      mutation: {},
      action: {}
    };

    let start, end;

    // process
    for (const logEvent of logEvents) {
      const stateType = logEvent.stateType;
      const type = logEvent.type;

      if (type === events.ACTION.GENERATE_RANDOM) {
        used.general = true;
      } else if (type === events.MUTATION.SET_PARAM) {
        used.highlighted = true;
      } else if (
        type === events.MUTATION.CHANGE_PARAM_ACTIVE ||
        type === events.MUTATION.CHANGE_PARAMS_ACTIVE ||
        type === events.ACTION.SET_AUTO_FILTER_MODE
      ) {
        used.selection = true;
      } else if (type === events.ACTION.START_SAMPLER) {
        used.sampling = true;
      } else if (type === events.ACTION.GENERATE_EXTENTS) {
        used.extents = true;
      } else if (type === events.ACTION.MIX) {
        used.mixer = true;
      }

      if (!(type in actionGroups[stateType])) {
        actionGroups[stateType][type] = [];
      }

      actionGroups[stateType][type].push(logEvent);

      if (type === events.MUTATION.START_TRIAL) {
        start = new Date(logEvent.time);
      }

      if (type === events.MUTATION.END_TRIAL) {
        end = new Date(logEvent.time);
      }
    }

    // generate timeline
    const tlData = timeline(logEvents, out, combined, offset);
    offset += offsetInterval;

    // totals
    for (const key in tlData.totalTime) {
      if (!(key in counts)) {
        counts[key] = 0;
      }

      if (!(key in times)) {
        times[key] = 0;
      }

      counts[key] += 1;
      times[key] += tlData.totalTime[key];
    }

    // output
    // console.log(
    //  `[${id}] ${task}:\t${used.sampling}\t${used.highlighted}\t${used.selection}\t${used.extents}\t${used.general}\t${used.mixer}`
    // );
    //globTotal += actionGroups.action[events.ACTION.GENERATE_RANDOM].length;
    //adjTotal +=
    //  actionGroups.mutation[events.MUTATION.SET_ALL_SAMPLER_OPTIONS].length;

    // const dur = (end.getTime() - start.getTime()) / 1000 / 60;
    // timeTotal += dur;

    // console.log(
    //`${id}] ${task}:\t${actionGroups.action[events.ACTION.GENERATE_RANDOM].length}\t${actionGroups.mutation[events.MUTATION.SET_ALL_SAMPLER_OPTIONS].length}\t${dur}`
    // `${id}] ${task}:\t${dur}`
    // );
  }

  // write combined svg
  fs.writeFileSync(path.join(root, `${task}-timeline.svg`), combined.svg());

  // print averages
  for (const key in counts) {
    console.log(
      `[${key}]\tavg: ${times[key] / counts[key] / 1000}\tcount: ${counts[key]}`
    );
  }
}

// console.log(`avg glob: ${globTotal / 20}`);
// console.log(`avg adj: ${adjTotal / 20}`);
// console.log(`avg time: ${timeTotal / 10}`);
