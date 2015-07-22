import os from 'os';
import { getAllResourceIDs, getBulkPluginData } from '../index';

const MAX_WORKERS = os.cpus().length;

let plugins = { };
let resourceIDs = [ ];

function fetchResourceIDs(callback) {
  getAllResourceIDs(MAX_WORKERS, (err, idList) => {
    if (err) return callback(err);

    resourceIDs = idList;
    callback();
  });
}

function fetchPlugins(callback) {
  getBulkPluginData(resourceIDs, MAX_WORKERS, (err, pluginData) => {
    if (err) return callback(err);

    plugins = pluginData;
    callback();
  });
}

function onComplete() {
  console.log(plugins);
}

///

fetchResourceIDs(() => {
  fetchPlugins(() => {
    onComplete();
  });
});
