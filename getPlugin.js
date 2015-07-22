var casper = require('casper').create();

var baseURL = 'http://forums.pocketmine.net/';
var startPath = 'plugins/';
var startURL = baseURL + startPath;

var resourceID = casper.cli.args[0];
var pluginURL = startURL + resourceID + '/';

casper.start(pluginURL + 'history/', function () {

  var plugin = this.evaluate(function () {
    var plugin = { };

    // Plugin name
    plugin.plugin_name = document
      .querySelector('meta[property="og:title"]')
      .getAttribute('content');

    // Plugin author
    plugin.authors = [
      document.querySelector('#resourceInfo dl.author dd a').innerText
    ];

    // Plugin category
    plugin.categories = [
      document.querySelector('#resourceInfo dl.resourceCategory dd a').innerText
    ];

    // Plugin logo image URL
    plugin.logo = document
      .querySelector('.resourceInfo img.resourceIcon')
      .getAttribute('src');

    // Plugin description
    plugin.description = document
      .querySelector('.resourceInfo p.tagLine').innerText;

    // Total downloads
    var totalDownloads = parseInt(document
      .querySelector('#resourceInfo dl.downloadCount dd')
      .innerText
      .replace(',', ''));

    plugin.popularity = {
      total: totalDownloads
    };

    // Plugin versions
    var versionList = document
      .querySelectorAll('table.resourceHistory tr.dataRow');

    versionList = Array.prototype.slice.call(versionList, 1);

    plugin.versions = Array.prototype.map.call(versionList, function (row) {
      var version = { };

      try {
        version.version = row
          .querySelector('td.version')
          .innerText;

        version.date = row
          .querySelector('td.releaseDate .DateTime')
          .getAttribute('title');

        version.download = row
          .querySelector('td.dataOptions.download a')
          .getAttribute('href');

        version.filename = plugin.plugin_name + '_' + version.version + '.phar';
      } catch (err) {
        version = null;
      }

      return version;
    });

    return plugin;
  });

  plugin.logo = baseURL + plugin.logo;

  plugin.versions = plugin.versions.map(function (version) {
    version.download = baseURL + version.download;
    return version;
  });

  plugin.server = 'pocketmine';

  plugin.website = pluginURL;

  var resourceIDParts = resourceID.match(/^(.+)\.([0-9]+)$/);
  plugin.slug = resourceIDParts[1];
  plugin.id = resourceIDParts[2];

  this.echo(JSON.stringify(plugin, null, 2));
});

casper.run();
