define([
  'dojo/_base/declare', './TabViewerBase', 'dojo/on',
  'dojo/dom-class', 'dijit/layout/ContentPane', 'dojo/dom-construct',
  '../PageGrid', '../formatter', '../../util/PathJoin', 'dojo/request', 'dojo/_base/lang', '../DataItemFormatter'
], function (
  declare, TabViewerBase, on,
  domClass, ContentPane, domConstruct,
  Grid, formatter, PathJoin, xhr, lang, DataItemFormatter
) {
  return declare([TabViewerBase], {
    baseClass: 'Serology',
    disabled: false,
    containerType: 'serology_data',
    query: null,
    experiment: null,
    eid: null,
    pdb: null,
    apiServiceUrl: window.App.dataAPI,
    perspectiveLabel: 'Serology View',
    perspectiveIconClass: 'icon-selection-Sequence',
    defaultTab: 'Overview',

    _setStateAttr: function (state) {
      this.state = this.state || {};
      var parts = state.pathname.split('/');
      this.set('eid', parts[parts.length - 1]);
      state.eid = parts[parts.length - 1];
      this.eid = state.eid;
      if (state.experiment) {
        this.set('experiment', state.experiment);
      }
      if (state.search) {
        this.set('query', state.search);
      }
      this._set('state', state);
    },

    _setExperimentAttr: function (experiment) {
      if (!experiment) {
        return;
      }

      let parts = [experiment.sample_identifier];
      if (experiment.host_common_name) {
        parts.push(experiment.host_common_name);
      }
      if (experiment.collection_country) {
        parts.push(experiment.collection_country);
      }

      this.queryNode.innerHTML = parts.join(' | ');
    },

    onSetState: function (attr, oldVal, state) {
      // console.log("GenomeList onSetState()  OLD: ", oldVal, " NEW: ", state);

      var parts = state.pathname.split('/');
      this.set('eid', parts[parts.length - 1]);
      state.eid = parts[parts.length - 1];
      if (!state) {
        return;
      }

      if (state && state.eid && !state.experiment) {
        state.experiment = this.experiment;
      }

      if (state.hashParams && state.hashParams.view_tab) {
        // console.log("state.hashParams.view_tab=", state.hashParams.view_tab);

        if (this[state.hashParams.view_tab]) {
          var vt = this[state.hashParams.view_tab];
          vt.set('visible', true);
          this.viewer.selectChild(vt);
        } else {
          console.log('No view-tab supplied in State Object');
        }
      }

      this.setActivePanelState();
    },

    setActivePanelState: function () {
      var activeQueryState;
      if (!this._started) {
        console.log('Feature Viewer not started');
        return;
      }

      if (this.state.eid) {
        activeQueryState = lang.mixin({}, this.state, { search: 'eq(eid,' + this.state.eid + ')' });
      }

      var active = (this.state && this.state.hashParams && this.state.hashParams.view_tab) ? this.state.hashParams.view_tab : 'overview';

      var activeTab = this[active];
      // console.log("Active: ", active, "state: ", this.state, " this=", this, " activeTab", this['overview']);

      if (!activeTab) {
        console.log('ACTIVE TAB NOT FOUND: ', active);
        return;
      }

      switch (active) {
        default:
          if (activeQueryState) {
            activeTab.set('state', activeQueryState);
          }
          // console.log("SET ACTIVE STATE for default tab: ", this.state);
          break;
      }
      // console.log("Set Active State COMPLETE");
    },

    createOverviewPanel: function (state) {
      return new ContentPane({
        title: 'Overview',
        id: this.viewer.id + '_overview',
        state: this.state
      });
    },

    postCreate: function () {
      if (!this.state) {
        this.state = {};
      }

      this.inherited(arguments);

      this.totalCountNode.innerHTML = '';

      let q = `?eq(sample_identifier,${this.eid})`;
      if (this.query) {
        this.query.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            q += `&eq(${key},${value})`;
          }
        });
      }

      xhr.get(PathJoin(this.apiServiceUrl, 'serology', q), {
        headers: {
          accept: 'application/json',
          'X-Requested-With': null,
          Authorization: (window.App.authorizationToken || '')
        },
        handleAs: 'json'
      }).then(lang.hitch(this, function (experiments) {
        var experiment = experiments[0];
        this.overview = this.createOverviewPanel(this.state);

        this.viewer.addChild(this.overview);

        this.set('experiment', experiment);
        this.state.experiment = experiment;
        this.setActivePanelState();

        var node = domConstruct.create('div', { style: 'width: 95%' }, this.overview.containerNode);
        domConstruct.place(DataItemFormatter(experiment, 'serology_data', {}), node, 'first');
      }));
    }
  });
});
