var casper = require('casper').create();

var baseURL = 'http://forums.pocketmine.net/';
var startPath = 'plugins/';
var startURL = baseURL + startPath;

var currentPage = 0, lastPageNumber = 0, completedPages = 0;
var plugins = [ ];

///

function loadInitialPage() {
  // Fetch number of pages
  lastPageNumber = this.evaluate(getLastPageNumber);

  // Tell Casper to scrape each page
  while (currentPage < lastPageNumber) {
    scrapePluginListPage(++currentPage);
  }
}

/**
 * Parses the pageNavHeader <span> tag to retrieve the last page number, and
 * thus the total page count. We'll use this to iterate through every page.
 * @return {Number} Total number of pages
 */
function getLastPageNumber() {
  return parseInt(document
    .querySelector('span.pageNavHeader')
    .innerText
    .match(/^\s*Page\s[0-9]+\sof\s([0-9]+)\s*$/)[1]);
}

function scrapePluginListPage(pageNumber) {
  casper.thenOpen(startURL + '?page=' + pageNumber, function () {
    var pluginItems = this.evaluate(getPluginListItems);

    pluginItems.forEach(function(resourceID) {
      plugins.push(resourceID);
    });

    completedPages++;
    this.emit('page.completed');
  });
}

function getPluginListItems() {
  var items = document.querySelectorAll('li.resourceListItem');

  return Array.prototype.map.call(items, function (item) {
    return item
      .querySelector('h3.title a:not(.prefixLink)')
      .getAttribute('href')
      .replace(/^plugins\//, '')
      .replace(/\/$/, '');
  });
}

///

casper.on('page.completed', function () {
  if (completedPages === lastPageNumber) {
    this.echo(JSON.stringify(plugins, null, 2));
  }
});

casper.start(startURL, loadInitialPage);
casper.run();
