define([
  'dojo/_base/declare', 'dojo/_base/lang', 'dojo/request/xhr', 'dojox/xml/DomParser', 'dojo/dom-construct',
  '../../../util/PathJoin', '../../viewer/TabViewerBase', './../OutbreaksOverview', './../OutbreaksTab', './PriorityPathogenGrid',
  '../OutbreaksTabContainer', '../OutbreaksPhylogenyTreeViewer', 'dojo/text!./OverviewDetails.html', 'dojo/text!./Webinars.html',
  'dojo/text!./Contents.html'
], function (
  declare, lang, xhr, domParser, domConstruct,
  PathJoin, TabViewerBase, OutbreaksOverview, OutbreaksTab, PriorityPathogenGrid,
  OutbreaksTabContainer, OutbreaksPhylogenyTreeViewer, OverviewDetailsTemplate, WebinarsTemplate,
  ContentsTemplate
) {

  function parseCSVLine(line) {
    const result = [];
    let field = '', inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i], next = line[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    result.push(field);
    return result;
  }

  return declare([TabViewerBase], {
    perspectiveLabel: '',
    perspectiveIconClass: '',
    title: '<h1 class="appHeader" style="color: #2a6d9e; margin-top: 10px; font-weight: bold;">Outbreak Response</h1>',
    priorityPathogenListURL: 'https://www.bv-brc.org/api/content/data/human_viral_pathogens.csv',
    highPriorityColor: '#ffcccc',
    moderatePriorityColor: '#fff2cc',
    lowPriorityColor: '#ccffcc',

    onSetState: function (attr, oldVal, state) {
      if (!state) {
        return;
      }

      this.buildHeaderContent();
      this.setActivePanelState();
    },

    setActivePanelState: function () {
      const active = this.state?.hashParams?.view_tab || 'overview';
      const activeTab = this[active];
      const activeQueryState = lang.mixin({}, this.state);

      if (!activeTab) {
        console.warn('Active tab not found:', active);
        return;
      }

      activeTab.set('visible', true);
      this.viewer.selectChild(activeTab);

      if (active === 'phylogenetics') {
        this.phylogenyH5N1.set('state', activeQueryState);
      } else if (active === 'priority') {
        this.priority.resizeGrid();
      } else {
        activeTab.set('state', activeQueryState);
      }
    },

    buildHeaderContent: function () {
      this.queryNode.innerHTML = '<span class="searchField" style="font-size:large">' + this.title + '</span>';
      this.totalCountNode.innerHTML = '';
    },

    adjustScrollHeight: function () {
      const prime = document.querySelector('.column-prime');
      const columnSub = document.querySelector('.column-sub');
      const contentSection = document.querySelector('#content-section');
      const scrollContainer = document.querySelector('.priority-scroll-container');

      if (prime && columnSub && contentSection && scrollContainer) {
        const primeHeight = prime.offsetHeight;
        columnSub.style.height = primeHeight + 'px';

        const contentHeight = contentSection.offsetHeight;

        // Adjust margin/padding if needed here
        const maxScrollHeight = primeHeight - contentHeight;
        scrollContainer.style.maxHeight = (maxScrollHeight > 0 ? maxScrollHeight : 0) + 'px';
      }
    },

    destroy: function () {
      if (this._resizeListenerAdded && this._boundAdjustScrollHeight) {
        window.removeEventListener('resize', this._boundAdjustScrollHeight);
      }
      this.inherited(arguments);
    },

    postCreate: function () {
      this.state ||= {};
      this.inherited(arguments); // creates this.viewer

      this._createTabs();

      // Watch tab changes, add listener on first switch to overview
      this.viewer.watch('selectedChildWidget', (name, oldTab, newTab) => {
        if (newTab === this.overview && !this._resizeListenerAdded) {
          this.adjustScrollHeight();
          this._boundAdjustScrollHeight = lang.hitch(this, this.adjustScrollHeight);
          window.addEventListener('resize', this._boundAdjustScrollHeight);
          this._resizeListenerAdded = true;
        }
      });

      this._loadPriorityPathogenData().then(lang.hitch(this, function (parsed) {
        if (!parsed) return;
        const {data, headers, familyPriorityMap} = parsed;

        // Update Overview tab with priority list table
        if (this.overview) {
          // create the priority list DOM element
          const priorityListNode = this._createPriorityPathogenTable(familyPriorityMap);

          // Append priority list table to left panel on overview page
          const rightPanelNode = this.overview.rightPanelNode;
          if (rightPanelNode) {
            domConstruct.place(priorityListNode, rightPanelNode, 2);

            // If overview tab is active on page load, do initial adjust and add listener
            if (this.viewer.selectedChildWidget === this.overview && !this._resizeListenerAdded) {
              this.adjustScrollHeight();
              this._boundAdjustScrollHeight = lang.hitch(this, this.adjustScrollHeight);
              window.addEventListener('resize', this._boundAdjustScrollHeight);
              this._resizeListenerAdded = true;
            }
          }
        }

        // Update Priority tab grid with data and headers
        if (this.priority) {
          this.priority.setData(data, headers);
        }
      }));

    },

    _createTabs: function () {
      this._createOverviewTab();
      this._createPriorityPathogenTab();
      //this._createPhylogeneticsTab();
      this._createWebinarsTab();
    },

    _createOverviewTab: function () {
      //const pathogenTable = this._createPriorityPathogenTable(familyPriorityMap);
      this.overview = new OutbreaksOverview({
        title: 'Overview',
        id: this.viewer.id + '_overview',
        detailsHTML: OverviewDetailsTemplate,
        rightPanelContent: [],
        leftPanelContent: [ContentsTemplate]
      });
      this.viewer.addChild(this.overview);
    },

    _createPriorityPathogenTab: function (data, headers) {
      this.priority = new PriorityPathogenGrid({
        title: 'Viral Priority Pathogen List',
        id: this.viewer.id + '_priority',
        data: data,
        headers: headers
      });
      this.viewer.addChild(this.priority);
    },

    _createWebinarsTab: function () {
      this.webinars = new OutbreaksTab({
        title: 'Webinars',
        id: this.viewer.id + '_webinars',
        templateString: WebinarsTemplate
      });
      this.viewer.addChild(this.webinars);
    },

    _createPhylogeneticsTab: function () {
      // Initialize Phylogenetic Tree Viewer
      const h5n1Decorator = 'vipr:';

      const sharedSettings = {
        shapes: ['square', 'diamond', 'triangle-up', 'triangle-down', 'cross', 'circle'],
        sizes: [20, 60],
        colorsAlt: ['#FF0000', '#000000', '#00FF00']
      };

      const h5n1Visualizations = [
        ['Host', 'the host of the virus'],
        ['Host_Group', 'the host group of the virus'],
        ['Host_Group_Domestic_vs_Wild', 'the host range of the virus'],
        ['Region', 'the geographic region of the virus'],
        ['Country', 'the country of the virus'],
        ['State', 'the state'],
        ['Year', 'the year of the virus'],
        ['Subtype', 'the sub type of the virus'],
        ['H5_clade', 'the H5 clade']
      ];

      const h5n1NodeVisualizations = {};
      const h5n1NodeLabels = {};

      h5n1Visualizations.forEach(([key, description]) => {
        h5n1NodeVisualizations[key] = lang.mixin({
          label: key.replace(/_/g, ' '),
          description: description,
          field: null,
          cladeRef: h5n1Decorator + key,
          regex: false,
          colors: 'category50'
        }, sharedSettings);

        h5n1NodeLabels[key] = {
          label: key.replace(/_/g, ' '),
          description: 'to use ' + key.replace(/_/g, ' ') + ' as part of node names',
          propertyRef: h5n1Decorator + key,
          selected: key === 'H5_clade',
          showButton: true
        };
      });

      const phylogenySegmentId = 'phylogenyH5N1';
      this[phylogenySegmentId] = new OutbreaksPhylogenyTreeViewer({
        title: 'H5N1 Segment 4 (HA)',
        id: this.viewer.id + '_' + phylogenySegmentId,
        phyloxmlTreeURL: 'https://www.bv-brc.org/api/content/phyloxml_trees/H5N1/h5n1_segment_4.xml',
        updateState: true,
        settings: {
          border: '1px solid #909090',
          enableDownloads: true,
          enableDynamicSizing: true,
          enableCollapseByFeature: true,
          enableNodeVisualizations: true,
          enableBranchVisualizations: false,
          enableSubtreeDeletion: true,
          nhExportWriteConfidences: true,
          controls0Left: 20,
          controls1Width: 120,
          rootOffset: 220,
          controls0Top: 10,
          controls1Top: 10,
          showSequenceButton: false,
          showShortenNodeNamesButton: false,
          showExternalLabelsButton: false,
          showInternalLabelsButton: false,
          showExternalNodesButton: false,
          showInternalNodesButton: false
        },
        options: {
          minBranchLengthValueToShow: 0.001,
          minConfidenceValueToShow: 50,
          initialNodeFillColorVisualization: 'Host Group (Domestic vs Wild)',
          phylogram: true,
          showConfidenceValues: false,
          showExternalLabels: true,
          showNodeName: true,
          showNodeVisualizations: true,
          showVisualizationsLegend: true,
          visualizationsLegendOrientation: 'vertical',
          visualizationsLegendXpos: 220,
          visualizationsLegendYpos: 30
        },
        nodeVisualizations: h5n1NodeVisualizations,
        specialVisualizations: h5n1NodeLabels
      });

      this.phylogenetics = new OutbreaksTabContainer({
        title: 'Phylogenetics',
        id: this.viewer.id + '_phylogenetics',
        tabContainers: [this[phylogenySegmentId]]
      });
      this.viewer.addChild(this.phylogenetics);
    },

    _loadPriorityPathogenData: function () {
      return xhr.get(this.priorityPathogenListURL, {
        handleAs: 'text'
      }).then((csvText) => {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return null;

        const headers = parseCSVLine(lines[0]);

        const familyPriorityMap = {};
        const data = lines.slice(1).map(function (line, idx) {
          const row = {};
          const fields = parseCSVLine(line);
          headers.forEach(function (h, i) {
            row[h] = fields[i] || '';
          });
          row.id = idx;

          const family = row['Family']?.trim();
          const priority = row['BV-BRC Priority']?.trim();
          if (family && priority && !(family in familyPriorityMap)) {
            familyPriorityMap[family] = priority.toLowerCase().replace(/[^a-z]/g, '');
          }

          return row;
        });

        return {data, headers, familyPriorityMap};
      });
    },

    _createPriorityPathogenTable: function (familyPriorityMap) {
      const priorityColors = {
        high: this.highPriorityColor
      };
      const virusList = domConstruct.create('div', {
        className: 'section',
        style: 'padding-left: 10px'
      });

      // Create section title
      domConstruct.create('h3', {
        className: 'close2x section-title',
        innerHTML: '<span class="wrap">Priority List</span>'
      }, virusList);

      const scrollContainer = domConstruct.create('div', {
        className: 'priority-scroll-container',
        style: 'overflow-y: auto; position: relative;'
      }, virusList);

      const table = domConstruct.create('table', {
        style: 'border-collapse: collapse; width: 100%;'
      }, scrollContainer);

      // Sticky table header
      const thead = domConstruct.create('thead', null, table);
      const headerRow = domConstruct.create('tr', null, thead);
      ['Family', 'Priority'].forEach(label => {
        domConstruct.create('th', {
          innerHTML: label,
          style: `
            padding: 6px 10px;
            background: #eee;
            text-align: left;
            position: sticky;
            top: 0;
            z-index: 2;
            border-bottom: 1px solid #ccc;
          `
        }, headerRow);
      });

      // Sort entries by Family name
      const sortedEntries = Object.entries(familyPriorityMap).sort((a, b) => {
        return a[0].localeCompare(b[0]);
      });

      const tbody = domConstruct.create('tbody', null, table);
      // Data rows from familyPriorityMap
      sortedEntries.forEach(([family, priority]) => {
        const row = domConstruct.create('tr', {
          style: `background-color: ${priorityColors[priority] || 'transparent'}`
        }, tbody);

        [family, priority].forEach(text => {
          domConstruct.create('td', {
            innerHTML: text,
            style: 'border: 1px solid #ccc; padding: 6px 10px; text-align: left;'
          }, row);
        });
      });

      return virusList;
    }
  });
});
