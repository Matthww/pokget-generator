import { spawn } from 'child_process';

let plugins = [ ];

console.log('Fetching plugin list');

// Get plugin list
let pluginListProccess = spawn('casperjs', [ 'getPluginList.js' ]);

pluginListProccess.stdout.on('data', (data) => {
  plugins = JSON.parse(data);

  console.log(plugins);
});
