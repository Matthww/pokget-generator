import async from 'async';
import cheerio from 'cheerio';
import request from 'request';

let BASE_URL = 'http://forums.pocketmine.net';

/**
 * Simplified page fetch function which returns a Cheerio $ instance for the
 * specified page via callback. All paths are prepended using BASE_URL.
 *
 * Callback returns an error (if present) and a Cheerio $.
 *
 * @param  {String}   path
 * @param  {Function} callback Called on completion
 */
function loadPage(path, callback) {
  request(`${BASE_URL}/${path}`, (err, response, body) => {
    if (err) {
      return callback(err);
    }

    callback(null, cheerio.load(body));
  });
}

/**
 * Reads the base /plugins page on the PocketMine website to obtain the last
 * page number and thus the total number of pages of plugins available.
 *
 * Callback returns an error (if present) and the last page number.
 *
 * @param  {Function} callback Called on completion
 */
function getLastPageNumber(callback) {
  loadPage('plugins', (err, $) => {
    if (err) return callback(err);

    let numPages = $('span.pageNavHeader')
      .text()
      .match(/^\s*Page\s[0-9]+\sof\s([0-9]+)\s*$/)[1];

    numPages = parseInt(numPages);

    callback(null, numPages);
  });
}

/**
 * Fetches the page associated with the provided page number and retrieves all
 * plugin resource IDs listed on that page.
 *
 * Callback returns an error (if present) and an array of resource ID strings.
 *
 * @param  {Number}   pageNumber The page number to search
 * @param  {Function} callback   Called on completion
 */
function getPluginsOnPage(pageNumber, callback) {
  let plugins = [ ];

  loadPage(`plugins/?page=${pageNumber}`, (err, $) => {
    if (err) return callback(err);

    $('li.resourceListItem h3.title a:not(.prefixLink)').each((index, element) => {
      let resourceID = $(element)
        .attr('href')
        .replace(/^plugins\//, '')
        .replace(/\/$/, '');

      plugins.push(resourceID);
    });

    callback(null, plugins);
  });
}

/**
 * Fetches the last page number via getLastPageNumber, then iterates from page
 * 1 to lastPageNumber using numWorkers simultaenous workers to retrieve
 * a full list of plugin resource IDs. These IDs can later be used to fetch
 * information about the plugin using getPluginData.
 *
 * Callback returns the error (if present) and an array of resource ID strings.
 *
 * @param  {[type]}   numWorkers Maximum number of simultaenous workers
 * @param  {Function} callback   Called on completion
 */
function getAllResourceIDs(numWorkers, callback) {
  let resourceIDs = [ ];

  getLastPageNumber((err, lastPageNumber) => {
    if (err) throw err;

    async.timesLimit(lastPageNumber, numWorkers,
      (n, next) => {
        let pageNumber = n + 1;

        getPluginsOnPage(pageNumber, (err, plugins) => {
          if (err) return next(err);

          resourceIDs = resourceIDs.concat(plugins);
          next();
        });
      },
      (err) => {
        callback(err, resourceIDs);
      }
    );
  });
}

/**
 * Fetches the plugin version history page with the specified resource ID
 * on the PocketMine website, then extracts various pieces of plugin-related
 * information and returns it via callback.
 *
 * Callback returns an error (if present) and the plugin data in object form.
 *
 * @param  {String}   resourceID In the format "plugin-name.#####"
 * @param  {Function} callback   Called on completion
 */
function getPluginData(resourceID, callback) {
  let plugin = { };
  let pluginURL = `plugins/${resourceID}`;

  loadPage(`${pluginURL}/history`, (err, $) => {
    if (err) return callback(err);

    // The plugin name on this page includes the version, so we'll first
    // grab the version and then create a regular expression to remove that
    // from the full title, to get just the plugin's name by itself.
    let currentVersion = $('.resourceInfo h1 span').text();

    // We need to escape the dots in the version number
    let cvRegex = new RegExp('\\s' + currentVersion.replace(/\./g, '\\.') + '\\s*$', 'g');

    plugin.plugin_name = $('.resourceInfo h1')
      .text()
      .replace(cvRegex, '')
      .trim();

    // Plugin author
    plugin.authors = [
      $('#resourceInfo dl.author dd a').text()
    ];

    // Plugin category
    plugin.categories = [
      $('#resourceInfo dl.resourceCategory dd a').text()
    ];

    // Plugin logo URL
    plugin.logo = BASE_URL + '/' + $('.resourceInfo img.resourceIcon').attr('src');

    // Plugin description
    plugin.description = $('.resourceInfo p.tagLine').text();

    // Plugin download count
    // PocketMine only tracks total downloads, so that's all we can provide.
    var totalDownloads = $('#resourceInfo dl.downloadCount dd')
      .text()
      .replace(',', '');

    plugin.popularity = {
      total: parseInt(totalDownloads)
    };

    // Plugin server software
    plugin.server = 'pocketmine';

    // Plugin website
    plugin.website = pluginURL;

    // Plugin slug and numeric resource ID number
    var resourceIDParts = resourceID.match(/^(.+)\.([0-9]+)$/);
    plugin.slug = resourceIDParts[1];
    plugin.id = resourceIDParts[2];

    // Plugin versions
    plugin.versions = [ ];

    $('table.resourceHistory tr.dataRow')
      .slice(1)
      .each((index, element) => {
        var version = { };

        try {
          version.version = $(element)
            .find('td.version')
            .text();

          version.date = $(element)
            .find('td.releaseDate abbr')
            .attr('data-time');

          if (typeof version.date === 'undefined') {
            version.date = $(element)
              .find('td.releaseDate .DateTime')
              .attr('title');
          }

          version.download = BASE_URL + '/' + $(element)
            .find('td.dataOptions.download a')
            .attr('href');

          version.filename = plugin.plugin_name + '_' + version.version + '.phar';
        } catch (err) {
          console.log(err);

          return null;
        }

        plugin.versions.push(version);
      });

    callback(null, plugin);
  });
}

function getBulkPluginData(resourceIDs, numWorkers = 1, callback) {
  let plugins = { };

  async.eachLimit(resourceIDs, numWorkers, (id, next) => {

    getPluginData(id, (err, plugin) => {
      if (err) return next(err);

      plugins[plugin.slug] = plugin;
      next();
    });

  }, (err) => {
    callback(err, plugins);
  });
}

export default {
  getLastPageNumber,
  getPluginsOnPage,
  getAllResourceIDs,
  getPluginData,
  getBulkPluginData
};
