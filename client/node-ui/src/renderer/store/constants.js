export const PARAM_COLOR_MODE = {
  REDGREEN: 'red-green',
  BLUEGREEN: 'blue-green',
  REDBLUE: 'red-blue',
  GREYSCALE: 'grey',
  BLUEYELLOW: 'blue-yellow'
};

export const THRESHOLD_MODE = {
  ABSOLUTE: 'ABSOLUTE',
  MAX_REL: 'MAX_REL',
  CURRENT_REL: 'CURRENT_REL',
  CURRENT_ABS: 'CURRENT_ABS'
};

export const THRESHOLD_TEXT = {
  ABSOLUTE: 'Absolute',
  MAX_REL: '% of Max',
  CURRENT_REL: '+% Current',
  CURRENT_ABS: '+x Current'
};

export const THRESHOLD_ACCEPT_MODE = {
  GREATER: 'gt',
  LESSER: 'lt',
  DISTANCE: 'absRadius',
  WITHIN_RADIUS: 'radius'
};

export const THRESHOLD_ACCEPT_TEXT = {
  GREATER: 'Greater Than',
  LESSER: 'Less Than',
  DISTANCE: 'Within Radius of Score',
  WITHIN_RADIUS: 'Better Within Radius of Score'
};

export const SERVER_STATUS = {
  TRAIN: 'Training',
  SAMPLE: 'Sampling',
  IDLE: 'Idle'
};

export const AUTO_FILTER_MODE = {
  NO_FILTER: 'No Filter',
  IMPACT: 'Impact',
  BEST: 'Best'
};

export const MUTATION = {
  SET_PORT: 'Set Snippet Port',
  CONNECT: 'Connect Snippet Server Driver',
  DISCONNECT: 'Disconnect Snippet Server Driver',
  STATUS_UPDATE: 'Server Status Update',
  NEW_SNIPPET: 'New Snippet',
  DELETE_SNIPPET: 'Delete Snippet',
  ADD_EXAMPLE: 'Add Example',
  DELETE_EXAMPLE: 'Delete Example',
  ADD_TRAINED_DATA: 'Add Training Data to Snippet',
  CLEAR_SAMPLES: 'Clear Samples',
  ADD_SAMPLE: 'Add Sample',
  SET_SERVER_STATUS_IDLE: 'Server Status: Idle',
  SET_SERVER_STATUS_TRAIN: 'Server Status: Training',
  SET_SERVER_STATUS_SAMPLE: 'Server Status: Sampling',
  EXPORT_SNIPPETS: 'Export Snippets',
  CACHE_SNIPPETS: 'Cache Snippets',
  LOAD_SNIPPETS: 'Load Cached Snippets',
  IMPORT_SNIPPETS: 'Import Snippets from File',
  SET_ACTIVE_SNIPPET_SCORE: 'Set Active Snippet Score',
  SET_PARAM_COLOR_DATA: 'Set Parameter Color Data',
  SET_SNIPPET_SETTING: 'Set Snippet Setting',
  LOAD_SNIPPET_SETTINGS: 'Load Snippet Settings',
  LOAD_NEW_FILE: 'Load Backend File',
  DETECT_BACKEND: 'Detect Backend Type',
  SET_PARAM: 'Set Parameter',
  SET_PARAMS: 'Set All Parameters',
  COMMIT_PARAMS: 'Commit Parameters',
  SNAPSHOT: 'Create Snapshot',
  RESET_SNAPSHOT: 'Reset Snapshot State',
  SET_BACKEND_SETTING: 'Set Backend Setting',
  COPY_SNIPPET: 'Copy Snippet',
  RENAME_SNIPPET: 'Rename Snippet',
  CLEAR_CACHE: 'Clear Snippet Cache',
  SHOW_EXTENTS: 'Show Extents Panel',
  HIDE_EXTENTS: 'Hide Extents Panel',
  CLEAR_EXTENTS: 'Clear Current Extents Elements',
  GENERATE_EXTENTS: 'Generate Extents for Parameter',
  SET_MIX_A: 'Set Mix A Element',
  SET_MIX_B: 'Set Mix B Element',
  SET_MIX_RESULTS: 'Set Mix Results',
  CHANGE_PARAM_ACTIVE: 'Add/Remove Parameter from Active Set',
  CHANGE_PARAMS_ACTIVE: 'Add/Remove Parameters from Active Set',
  SET_ALL_ACTIVE: 'Add All Parameters to Active Set',
  SET_NONE_ACTIVE: 'Remove All Parameters from Active Set',
  SET_INACTIVE_VISIBILITY: 'Change Visibility of Inactive Parameters',
  NEW_PARAM_SET: 'New Parameter Set',
  UPDATE_PARAM_SET: 'Update Parameter Set',
  DELETE_PARAM_SET: 'Delete Parameter Set',
  LOAD_PARAM_SET: 'Load Parameter Set',
  ADD_ACTIVE_MIX_AXIS: 'Add Active Mix Axis',
  REMOVE_ACTIVE_MIX_AXIS: 'Remove Active Mix Axis',
  CLEAR_ACTIVE_MIX_AXES: 'Clear Active Mix Axes',
  SET_AXIS_MIX_RESULTS: 'Set Axis Mix Results',
  SET_PRIMARY_SNIPPET: 'Set Primary Snippet',
  ACTIVATE_SNIPPET: 'Activate Snippet',
  DEACTIVATE_SNIPPET: 'Deactivate Snippet',
  SET_SAMPLER_OPTION: 'Set Sampler Option',
  SET_ALL_SAMPLER_OPTIONS: 'Set All Sampler Options',
  SET_PARAMS_AS_FILTER: 'Set Params As Filter',
  SET_AUTO_FILTER_MODE: 'Set Auto-Filter Mode'
};

export const ACTION = {
  NEW_SNIPPET: 'New Snippet',
  DELETE_SNIPPET: 'Delete Snippet',
  TRAIN: 'Train Snippet',
  LOAD_SNIPPET: 'Load Snippet',
  ADD_EXAMPLE: 'Add Example',
  DELETE_EXAMPLE: 'Delete Example',
  SYNC: 'Sync with Snippet Server',
  CONNECT: 'Connect to Snippet Server',
  START_SAMPLER: 'Start Sampling',
  STOP_SAMPLER: 'Stop Sampling',
  DISCONNECT: 'Disconnect from Snippet Server',
  LOAD_SNIPPETS: 'Load Snippets',
  EVAL_CURRENT: 'Evaluate Current State with Current Snippet',
  LOAD_PARAM_COLOR_DATA: 'Load Preference Data for Current Parameters',
  SET_PARAM: 'Set Parameter',
  COMMIT_PARAMS: 'Commit Parameters',
  SHOW_TEMPORARY_STATE: 'Show Temporary Snapshot State',
  HIDE_TEMPORARY_STATE: 'Hide Temporary Snapshot State',
  LOCK_TEMPORARY_STATE: 'Lock Temporary Snapshot State',
  COPY_SNIPPET: 'Copy Snippet',
  RENAME_SNIPPET: 'Rename Snippet',
  GENERATE_RANDOM: 'Generate Random Set',
  GENERATE_EXTENTS: 'Generate Parameter Extents',
  MIX: 'Run Parameter Mix',
  LOAD_PARAM_SET: 'Load Parameter Group',
  MIX_AXES: 'Run Axis Mixer',
  SET_PRIMARY_SNIPPET: 'Set Primary Snippet',
  EVAL_THEN_EXECUTE: 'Evaluate Target Snippet then Execute Callback',
  JITTER_SAMPLE: 'Run Jitter Sampler',
  SELECT_DEFAULT_FILTER: 'Select Default Filter',
  SET_SELECTED_AS_FILTER: 'Set Selected Parameters as Filter',
  UPDATE_AUTO_FILTER_PARAMS: 'Update Auto-Filtered Params',
  SET_AUTO_FILTER_MODE: 'Set Auto-Filter Mode'
};
