define([
  'dojo/_base/declare', 'dojo/on',
  'dojo/store/Memory',
  './PageGrid', './GridSelector'
], function (
  declare, on,
  Memory,
  Grid, selector
) {
  return declare([Grid], {
    region: 'center',
    query: '',
    primaryKey: 'RowNumber',
    deselectOnRefresh: true,
    store: null,
    columns: {},

    constructor: function () {
      this.store = new Memory({
        idProperty: this.primaryKey,
        data: []
      });
    },

    setGridData: function (headers, dataRows) {
      var cols = {};
      var mappedRows = [];

      headers.forEach(function (header, idx) {
        var key = 'col_' + idx;
        cols[key] = {
          label: header,
          field: key,
          hidden: false
        };
      });

      dataRows.forEach(function (row, rowIdx) {
        var out = { RowNumber: rowIdx + 1 };
        headers.forEach(function (_, idx) {
          out['col_' + idx] = row[idx] || '';
        });
        mappedRows.push(out);
      });

      this.set('columns', cols);
      this.store.setData(mappedRows);
      this.refresh();
    },

    startup: function () {
      var _self = this;

      this.on('.dgrid-content .dgrid-row:dblclick', function (evt) {
        var row = _self.row(evt);
        on.emit(_self.domNode, 'ItemDblClick', {
          item_path: row && row.data && row.data.path,
          item: row && row.data,
          bubbles: true,
          cancelable: true
        });
      });

      this.on('dgrid-select', function (evt) {
        on.emit(_self.domNode, 'select', {
          rows: evt.rows,
          selected: evt.grid.selection,
          grid: _self,
          bubbles: true,
          cancelable: true
        });
      });

      this.on('dgrid-deselect', function (evt) {
        on.emit(_self.domNode, 'deselect', {
          rows: evt.rows,
          selected: evt.grid.selection,
          grid: _self,
          bubbles: true,
          cancelable: true
        });
      });

      this.inherited(arguments);
      this.refresh();
    }
  });
});
