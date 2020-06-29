# Design Adjectives

This readme is under construction, but hopefully it's enough to start.

This project is divided into three separate components: a user interface (`client/node-ui`), the model server (`core`), and the communication server (`server`). Each project has separate prereqs.

Prereqs:

- Model Server
  - Python 3
    - PyTorch 1.1.0+
    - gpytorch current
    - Pyro current
    - matplotlib current
    - express
    - python-socketio
- UI and Communication Server
  - node.js 10+ (Tested on 10 and 12)
  - yarn v1 (untested on yarn 2)

## Setup

Install the Python prerequisites. Inside of the `server` and `client/node-ui` folders, run `yarn install` (npm install probably works too).

Launch the communication server in `server` with `node ./toolboxServer.js --detached` and then run `python ./dsServer.py` from the same folder.

After the servers are up and running, you can launch the UI from `client/node-ui` with `yarn run dev`. Once launched, set the hostname and port according to where you launched the `toolboxServer` and you should be able to start using the Design Adjectives system.