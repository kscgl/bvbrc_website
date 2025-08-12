define([
  'dojo/_base/declare', 'dijit/_WidgetBase', 'dojo/request', 'dojo/store/Memory', 'dojo/on', 'dojo/dom-class',
  'dgrid/Grid', 'dgrid/extensions/Pagination', 'dgrid/extensions/ColumnResizer', 'dgrid/extensions/ColumnHider',
  'dojo/dom-construct', 'dojo/dom-style'
], function (
  declare, _WidgetBase, request, Memory, on, domClass,
  Grid, Pagination, ColumnResizer, ColumnHider,
  domConstruct, domStyle
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
    baseClass: 'PriorityPathogenGrid',
    grid: null,
    data: null,
    headers: null,

    postCreate: function () {
      this.inherited(arguments);
      this._selectedFacetFilters = {};

      const node = domConstruct.create('div', {
        style: 'margin: 10px;'
      }, this.domNode);

      this.grid = new declare([Grid, ColumnHider, ColumnResizer, Pagination])({
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
      this._originalData = data.slice();

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

      // Remove existing filter row
      if (this._filterRow) {
        domConstruct.destroy(this._filterRow);
      }

      // Create filter row
      this._filterRow = domConstruct.create('div', {
        className: 'hidden',
        style: 'white-space: nowrap; background: rgb(51, 51, 51); overflow: auto hidden; height: 150px; margin: 10px;'
      }, this.domNode, 'first');

      this._facetContainers = {};
      headers.forEach(h => {
        const facetDiv = domConstruct.create('div', {
          'class': 'FacetFilter'
        }, this._filterRow);

        this._facetContainers[h] = facetDiv;
      });
      this._renderFacets();

      // Update grid store and columns
      this.grid.set('columns', columns);
      this.grid.set('store', store);

      // Create the browser header container
      const browserHeader = domConstruct.create('div', {
        className: 'BrowserHeader',
        style: 'display: flex; justify-content: space-between; align-items: center;margin: 10px;'
      }, this.domNode, 'first');

      // left: Global Search Input
      const globalSearchWrapper = domConstruct.create('div', {
        className: 'GlobalSearchWrapper',
        style: 'flex: 1; position: relative; max-width: 280px;'
      }, browserHeader);

      this._globalSearchInput = domConstruct.create('input', {
        className: 'GlobalSearchInput',
        type: 'text',
        placeholder: 'Search table...',
        style: 'padding: 6px 10px; width: 100%; border: 1px solid #ccc;'
      }, globalSearchWrapper);

      this._globalSearchInput.addEventListener('input', () => {
        const val = this._globalSearchInput.value.trim();
        this._clearGlobalSearch.style.display = val ? 'inline' : 'none';
        this._applyFilters();  // reapply filters including global search
      });

      this._clearGlobalSearch = domConstruct.create('i', {
        className: 'fa icon-times-circle ClearGlobalSearch',
        style: 'display: none; cursor: pointer; position: absolute; right: -15px; top: 50%; transform: translateY(-50%); color: #999; font-size: 16px; z-index: 10;',
        onclick: () => {
          this._globalSearchInput.value = '';
          this._clearGlobalSearch.style.display = 'none';
          this._applyFilters();
        },
        onmouseenter: () => {
          domStyle.set(this._clearGlobalSearch, 'color', '#333');
          domStyle.set(this._clearGlobalSearch, 'cursor', 'pointer');
        },
        onmouseleave: () => {
          domStyle.set(this._clearGlobalSearch, 'color', '#999');
        }

      }, globalSearchWrapper);

      // right: Action Buttons (FILTERS and CLEAR FILTERS)
      const actionButtons = domConstruct.create('div', {
        className: 'ActionButtonGroup',
        style: 'display: flex; gap: 1rem; align-items: center;'
      }, browserHeader);

      const filterToggle = domConstruct.create('div', {
        className: 'ActionButtonWrapper',
        rel: 'ToggleFilters',
      }, actionButtons);

      domConstruct.create('div', {
        className: 'ActionButton fa icon-filter fa-2x'
      }, filterToggle);

      const filterText = domConstruct.create('div', {
        className: 'ActionButtonText',
        innerHTML: 'FILTERS'
      }, filterToggle);

      // Click handler to toggle filters
      on(filterToggle, 'click', () => {
        const isHidden = domClass.contains(this._filterRow, 'hidden');
        domClass.toggle(this._filterRow, 'hidden');

        // Update label accordingly
        filterText.innerHTML = isHidden ? 'HIDE' : 'FILTERS';
      });

      const clearBtn = domConstruct.create('div', {
        className: 'ActionButtonWrapper disabled',
        rel: 'ClearFilters',
        onclick: () => {
          this._selectedFacetFilters = {};
          this._applyFilters();
        }
      }, actionButtons);

      domConstruct.create('div', {
        className: 'ActionButton fa icon-eraser fa-2x',
        style: 'border: none;'
      }, clearBtn);

      domConstruct.create('div', {
        className: 'ActionButtonText',
        innerHTML: 'CLEAR',
        style: 'border: none;'
      }, clearBtn);
    },

    _renderFacets: function (data) {
      data = data || this._originalData || [];
      const countsByCol = {};

      this.headers.forEach(h => {
        countsByCol[h] = {};
      });

      data.forEach(row => {
        this.headers.forEach(h => {
          const val = row[h] || '';
          countsByCol[h][val] = (countsByCol[h][val] || 0) + 1;
        });
      });

      this.headers.forEach(h => {
        const container = this._facetContainers[h];
        domConstruct.empty(container);

        // Create facetHeader
        const headerDiv = domConstruct.create('div', {
          className: 'facetHeader',
          style: 'position: relative; display: flex; align-items: center; justify-content: space-between;'
        }, container);

        // Category label
        const categoryDiv = domConstruct.create('div', {
          className: 'facetCategory',
          innerHTML: h.toLowerCase()
        }, headerDiv);

        // Add 'selected' class if any filter selected for this column
        if (this._selectedFacetFilters && this._selectedFacetFilters[h]) {
          categoryDiv.classList.add('selected');
        } else {
          categoryDiv.classList.remove('selected');
        }

        // Search icon
        const searchIcon = domConstruct.create('i', {
          className: 'fa icon-search2 fa-1x facetCategorySearchBtn',
          style: 'cursor: pointer;'
        }, headerDiv);

        // Search box container (hidden initially)
        const searchBox = domConstruct.create('div', {
          className: 'facetSearch dijitHidden',
          style: 'margin: 5px 0;'
        }, container);

        // Input wrapper to match your styling
        const inputWrapper = domConstruct.create('div', {
          className: 'dijit dijitReset dijitInline dijitLeft dijitTextBox',
          style: 'width: 100%;'
        }, searchBox);

        const inputFieldContainer = domConstruct.create('div', {
          className: 'dijitReset dijitInputField dijitInputContainer'
        }, inputWrapper);

        const searchInput = domConstruct.create('input', {
          className: 'dijitReset dijitInputInner',
          type: 'text',
          autocomplete: 'off',
          placeholder: `filter ${h}`,
          style: 'width: 100%;'
        }, inputFieldContainer);

        // Container for clickable values
        const dataList = domConstruct.create('div', {
          className: 'dataList',
          style: 'max-height: 120px; overflow-y: auto;',
          'data-dojo-attach-point': 'containerNode'
        }, container);

        const entries = Object.entries(countsByCol[h])
          .filter(([val, count]) => val !== '' && count > 0)
          .sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase()));

        if (entries.length === 0) {
          container.style.display = 'none';
          return;
        } else {
          container.style.display = '';
        }

        this._selectedFacetFilters = this._selectedFacetFilters || {};

        entries
          .forEach(([val, count]) => {
            const label = val || '<i>empty</i>';
            const display = `${label}&nbsp;(${count})`;

            const isSelected = this._selectedFacetFilters && this._selectedFacetFilters[h] === val;
            const valDiv = domConstruct.create('div', {
              className: 'FacetValue' + (isSelected ? ' selected' : ''),
              innerHTML: display,
              rel: val,
              style: 'cursor: pointer;'
            }, dataList);

            // Highlight selected facets visually
            if (this._selectedFacetFilters[h] === val) {
              valDiv.classList.add('selected');
            }

            valDiv.addEventListener('click', evt => {
              evt.preventDefault();
              const prevSelected = this._selectedFacetFilters[h];
              if (prevSelected === val) {
                // Deselect if already selected
                delete this._selectedFacetFilters[h];
              } else {
                this._selectedFacetFilters[h] = val;
              }

              this._applyFilters();
            });

          });

        // Search icon toggles the search box visibility
        searchIcon.addEventListener('click', () => {
          if (searchBox.classList.contains('dijitHidden')) {
            searchBox.classList.remove('dijitHidden');
            searchInput.focus();
          } else {
            searchBox.classList.add('dijitHidden');
            searchInput.value = '';
            // Show all facet values again when search cleared
            Array.from(dataList.children).forEach(div => div.classList.remove('dijitHidden'));
          }
        });

        // Live filtering of facet values as user types
        searchInput.addEventListener('input', () => {
          const query = searchInput.value.trim().toLowerCase();
          Array.from(dataList.children).forEach(div => {
            const text = div.textContent.toLowerCase();
            div.classList.toggle('dijitHidden', !text.includes(query));
          });
        });
      });
    },

    _applyFilters: function () {
      const filters = this._selectedFacetFilters || {};
      const searchQuery = (this._globalSearchInput?.value || '').toLowerCase();

      const filtered = this._originalData.filter(row => {
        // Match facet filters
        const matchesFacets = Object.entries(filters).every(([col, val]) => {
          const cellVal = row[col] || '';
          return cellVal === val;
        });

        // Match global search
        const matchesSearch = !searchQuery || Object.values(row).some(val =>
          (val || '').toString().toLowerCase().includes(searchQuery)
        );

        return matchesFacets && matchesSearch;
      });

      // Update the grid store with filtered data
      const store = new Memory({data: filtered});
      this.grid.set('store', store);

      // Recompute and rerender facets with filtered data
      this._renderFacets(filtered);

      // Toggle "Clear Filters" disabled state
      const clearBtn = document.querySelector('.ActionButtonWrapper[rel="ClearFilters"]');
      const anyFiltersSelected = Object.keys(filters).length > 0;
      if (clearBtn) {
        clearBtn.classList.toggle('disabled', !anyFiltersSelected);
      }
    },

    resizeGrid: function () {
      if (this.grid) {
        this.grid.resize();
      }
    }
  });
});
