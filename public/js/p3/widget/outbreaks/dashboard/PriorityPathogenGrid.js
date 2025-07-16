define([
  'dojo/_base/declare', 'dijit/_WidgetBase', 'dojo/request', 'dojo/store/Memory',
  'dgrid/Grid', 'dgrid/extensions/Pagination', 'dgrid/extensions/ColumnResizer',
  'dojo/_base/lang', 'dojo/dom-construct'
], function (
  declare, _WidgetBase, request, Memory,
  Grid, Pagination, ColumnResizer,
  lang, domConstruct
) {

  function extractAccessions(raw) {
    if (!raw || typeof raw !== 'string') return [];

    return raw
      .split(/[;,]+/)  // split on ; or ,
      .map(token => token.trim())
      .map(entry => {
        const match = entry.match(/^([^:]+):\s*([A-Z]{1,2}\d{5,6})$/i);
        if (match) {
          return {prefix: match[1].trim(), acc: match[2].trim()};
        }

        // fallback if no prefix
        const accMatch = entry.match(/^([A-Z]{1,2}\d{5,6})$/i);
        if (accMatch) {
          return {prefix: null, acc: accMatch[1].trim()};
        }

        return null;
      })
      .filter(Boolean);
  }

  return declare([_WidgetBase], {
    baseClass: 'CSVGridViewer',
    grid: null,
    data: null,
    headers: null,

    postCreate: function () {
      this.inherited(arguments);

      const node = domConstruct.create('div', {
        style: 'margin: 10px;'
      }, this.domNode);

      this.grid = new declare([Grid, Pagination, ColumnResizer])({
        store: new Memory({data: []}),
        columns: {},
        rowsPerPage: 25,
        pagingLinks: 1,
        pagingTextBox: true,
        firstLastArrows: true,
        pageSizeOptions: [25, 50, 100],
        className: 'dgrid-autoheight',
        loadingMessage: 'Loading pathogen list...',
        noDataMessage: 'No pathogen list found.'
      }, node);

      this.grid.startup();

      // If data and headers already available on init
      if (this.data && this.headers) {
        this.setData(this.data, this.headers);
      }
    },

    setData: function (data, headers) {
      this.data = data;
      this.headers = headers;

      // Rebuild columns
      const columns = this.headers.reduce((cols, h) => {
        if (h === 'Genus' || h === 'Family') {
          cols[h] = {
            label: h,
            field: h,
            sortable: true,
            formatter: function (value, row) {
              const taxonId = row[`taxon_${h.toLowerCase()}_id`];
              if (value && taxonId) {
                return `<a href="https://www.bv-brc.org/view/Taxonomy/${taxonId}" target="_blank">${value}</a>`;
              }
              return value || '';
            }
          };
        } else if (h === 'GenBank Accession') {
          cols[h] = {
            label: h,
            field: h,
            sortable: true,
            formatter: function (value, row) {
              const accList = extractAccessions(value);
              const accToIdMap = row.genbank_genome_id_map || {}; // assume you attached this

              const links = accList.map(({prefix, acc}) => {
                const genomeId = accToIdMap[acc];
                const link = genomeId
                  ? `<a href="https://www.bv-brc.org/view/Genome/${genomeId}" target="_blank">${acc}</a>`
                  : acc;

                return prefix ? `${prefix}: ${link}` : link;
              });

              return links.join('; ');
            }
          };
        } else {
          cols[h] = {label: h, field: h, sortable: true};
        }
        return cols;
      }, {});

      // Create new store
      const store = new Memory({data: this.data});

      // Update grid store and columns
      this.grid.set('columns', columns);
      this.grid.set('store', store);
    },

    resizeGrid: function () {
      if (this.grid) {
        this.grid.resize();
      }
    }
  });
});
