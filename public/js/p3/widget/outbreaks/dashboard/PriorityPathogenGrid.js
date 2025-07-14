define([
  'dojo/_base/declare', 'dijit/_WidgetBase', 'dojo/request', 'dojo/store/Memory',
  'dgrid/Grid', 'dgrid/extensions/Pagination', 'dgrid/extensions/ColumnResizer',
  'dojo/_base/lang', 'dojo/dom-construct'
], function (
  declare, _WidgetBase, request, Memory,
  Grid, Pagination, ColumnResizer,
  lang, domConstruct
) {

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
        cols[h] = {label: h, field: h, sortable: true};
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
