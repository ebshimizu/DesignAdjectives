const events = require('./actions');
const fs = require('fs-extra');

// svg setup
// returns a window with a document and an svg root node
const window = require('svgdom');
const document = window.document;
const { SVG, registerWindow } = require('@svgdotjs/svg.js');

// register window and document
registerWindow(window, document);

// create canvas
const canvas = SVG(document.documentElement);
const height = 30;

const phaseEvents = {
  [events.MUTATION.SET_PARAM]: 'params',
  [events.MUTATION.SHOW_EXTENTS]: 'extents',
  [events.MUTATION.SET_MIX_A]: 'mix',
  [events.MUTATION.SET_MIX_B]: 'mix',
  [events.MUTATION.CHANGE_PARAM_ACTIVE]: 'selection',
  [events.MUTATION.SET_AUTO_FILTER_MODE]: 'selection',
  [events.MUTATION.SET_ALL_SAMPLER_OPTIONS]: 'adjective sample',
  [events.ACTION.JITTER_SAMPLE]: 'global sample',
  [events.ACTION.GENERATE_RANDOM]: 'global sample',
  [events.ACTION.MIX]: 'mix',
  [events.MUTATION.SET_RELEVANCE_THRESHOLD]: 'selection'
  // [events.ACTION.UPDATE_AUTO_FILTER_PARAMS]: 'selection'
};

const color = {
  params: '#290d0a',
  extents: '#672c11',
  mix: '#7c5900',
  selection: '#afeab5',
  'global sample': '#8bbcd9',
  'adjective sample': '#268ca7'
};

// conditions for phase markers
// - is a start sample event
// - is a randomizer/jitter event
// - is a set parameter event
// - mixer event
// - extents event
// - selection event
function isPhaseEvent(type) {
  if (type in phaseEvents) {
    return phaseEvents[type];
  }

  return null;
}

function timeline(log, outFile, combinedSVG, offset) {
  const phases = [];
  const previews = [];
  const examples = [];

  let start, end, endEvent;

  // first, dump all phase markers into an array
  // while we're at it, record the preview events too
  for (const logEvent of log) {
    const type = logEvent.type;
    const stateType = logEvent.stateType;

    if (type === events.MUTATION.START_TRIAL) {
      start = new Date(logEvent.time);
    }

    if (type === events.MUTATION.END_TRIAL) {
      end = new Date(logEvent.time);
      endEvent = logEvent;
    }

    const phaseType = isPhaseEvent(type);
    if (phaseType) {
      logEvent.phase = phaseType;
      phases.push(logEvent);
    }

    if (stateType === 'mutation' && type === events.MUTATION.ADD_EXAMPLE) {
      examples.push(logEvent);
    }

    if (stateType === 'action' && type === events.ACTION.SHOW_TEMPORARY_STATE) {
      previews.push(logEvent);
    }
  }

  // analyze interval
  // timings
  // black box for pre-timeline ops
  canvas
    .rect((new Date(phases[0].time).getTime() - start) / 1000, height)
    .fill('#bdc3c7');

  if (combinedSVG) {
    combinedSVG
      .rect((new Date(phases[0].time).getTime() - start) / 1000, height)
      .fill('#bdc3c7')
      .move(0, offset);
  }

  const totalTime = {};
  for (let i = 0; i < phases.length; i++) {
    const current = phases[i];
    const next = i + 1 < phases.length ? phases[i + 1] : endEvent;

    const startTime = new Date(current.time).getTime();

    const interval = new Date(next.time).getTime() - startTime;

    if (!(current.phase in totalTime)) totalTime[current.phase] = 0;

    totalTime[current.phase] += interval;

    if (combinedSVG) {
      combinedSVG
        .rect(interval / 1000, height)
        .fill(color[current.phase])
        .move((startTime - start) / 1000, offset);

      if (current.phase !== 'params') {
        combinedSVG
          .line(
            (startTime - start) / 1000,
            offset,
            (startTime - start) / 1000,
            offset + height
          )
          .stroke({ width: 0.5, color: 'black' });
      }

      if (current.phase === 'adjective sample') {
        let text = '';
        if (
          current.payload.thresholdEvalMode === 'gt' &&
          current.payload.threshold > 0
        ) {
          text = 'tw';
        } else if (current.payload.thresholdEvalMode === 'lt') {
          text = 'aw';
        } else if (current.payload.thresholdEvalMode === 'absRadius') {
          text = 'nr';
        } else if (
          current.payload.thresholdEvalMode === 'gt' &&
          current.payload.threshold === 0
        ) {
          text = 'ax';
        }

        combinedSVG
          .text(text)
          .move((startTime - start) / 1000, offset + 5)
          .font({ fill: 'black', family: 'Helvetica' });
      }
    } else {
      // draw a box
      canvas
        .rect(interval / 1000, height)
        .fill(color[current.phase])
        .move((startTime - start) / 1000, 0);

      // separate the box
      if (current.phase !== 'params') {
        canvas
          .line(
            (startTime - start) / 1000,
            0,
            (startTime - start) / 1000,
            height
          )
          .stroke({ width: 1, color: 'black' });
      }
    }
  }

  // export svg
  fs.writeFileSync(outFile, canvas.svg());

  console.log(totalTime);
  return { totalTime, duration: end - start, svg: canvas.svg() };
}

exports.timeline = timeline;
