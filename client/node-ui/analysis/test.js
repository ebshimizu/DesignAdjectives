const timeline = require('./timeline').timeline;
const fs = require('fs-extra');

const file =
  'C:/Users/Falindrith/Dropbox/Documents/research/project_3/study/data/08/task-2/actions.log';
const out =
  'C:/Users/Falindrith/Dropbox/Documents/research/project_3/study/data/08/task-2/timeline.svg';

const logData = fs.readFileSync(file).toString();
const logLines = logData.split('\n');
logLines.pop();
const logEvents = logLines.map(s => JSON.parse(s));

timeline(logEvents, out);
