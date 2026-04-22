define([
  'dojo/_base/declare',
  './Taxonomy', '../VirusOverview', '../PriorityPathogen'
], function (
  declare,
  Taxonomy, VirusOverview, PriorityPathogen
) {
  return declare([Taxonomy], {
    perspectiveLabel: 'Virus View',
    postCreate: function () {
      this.inherited(arguments);

      this.priorityPathogen = new PriorityPathogen({
        title: 'Priority Pathogen',
        id: this.viewer.id + '_priorityPathogen',
        state: this.state
      });
      this.viewer.addChild(this.priorityPathogen, 1);
    },
    createOverviewPanel: function () {
      return new VirusOverview({
        title: 'Overview',
        id: this.viewer.id + '_overview'
      });
    },
  });
});
