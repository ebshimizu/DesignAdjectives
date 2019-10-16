// Credits: borrowed code from vuex logger plugin
import fs from 'fs-extra';

export default function createLogger({ file } = {}) {
  return store => {
    let fd = null;

    try {
      fs.ensureFileSync(file);
      fd = fs.openSync(file, 'w+');
    } catch (e) {
      console.log('Failed to open file for logging');
      console.log(e);
    }

    store.subscribe(mutation => {
      const time = new Date();
      const formattedTime = `${pad(time.getHours(), 2)}:${pad(
        time.getMinutes(),
        2
      )}:${pad(time.getSeconds(), 2)}.${pad(time.getMilliseconds(), 3)}`;
      const message = `mutation ${mutation.type} @ ${formattedTime}`;

      const logObj = {
        time,
        formattedTime,
        type: mutation.type,
        payload: mutation.payload,
        textLog: message
      };

      // render
      const objStr = JSON.stringify(logObj) + '\n';
      fs.write(fd, objStr, function(err) {
        if (err) console.log(err);
      });
    });
  };
}

function repeat(str, times) {
  return new Array(times + 1).join(str);
}

function pad(num, maxLength) {
  return repeat('0', maxLength - num.toString().length) + num;
}
