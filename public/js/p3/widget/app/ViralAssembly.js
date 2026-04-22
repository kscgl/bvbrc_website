define([
  'dojo/_base/declare', 'dojo/topic', 'dojo/_base/lang', 'dojo/on', 'dojo/dom-class', 'dojo/dom-construct', 'dojo/dom-style',
  'dojo/text!./templates/ViralAssembly.html', 'dojo/store/Memory', 'dijit/popup', 'dijit/TooltipDialog', 'dijit/Dialog',
  './AppBase', '../../WorkspaceManager', 'dojo/request'
], function (
  declare, Topic, lang, on, domClass, domConstruct, domStyle,
  Template, Memory, popup, TooltipDialog, Dialog,
  AppBase, WorkspaceManager, xhr
) {

  return declare([AppBase], {
    baseClass: 'ViralAssembly',
    pageTitle: 'Viral Assembly Service - BETA',
    templateString: Template,
    applicationName: 'ViralAssembly',
    requireAuth: true,
    applicationLabel: 'Viral Assembly - BETA',
    applicationDescription: 'The Viral Assembly Service utilizes IRMA (Iterative Refinement Meta-Assembler) to assemble viral genomes. Users must select the virus genome for processing. This service is currently in beta, any feedback or improvement is welcomed.',
    applicationHelp: '',
    tutorialLink: 'tutorial/viral_assembly/assembly.html',
    defaultPath: '',
    srrValidationUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?retmax=1&db=sra&field=accn&term={0}&retmode=json',
    isSRAValid: false,

    // Similar Genome Finder (Mash/MinHash) config. Tweak here to change scope/thresholds.
    similarGenomeFinderConfig: {
      scope: 'ref',           // 'ref' = reference/representative only, 'all' = all public genomes
      includeBacterial: 0,
      includeViral: 1,
      maxPvalue: 1,
      maxDistance: 1,
      maxHits: 50
    },

    constructor: function () {
      this.paramToAttachPt = ['strategy', 'output_path', 'output_file', 'module'];
    },

    startup: function () {
      if (this._started) {
        return;
      }
      if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
        return;
      }
      this.inherited(arguments);
      const _self = this;
      _self.defaultPath = WorkspaceManager.getDefaultFolder() || _self.activeWorkspacePath;
      if (_self.output_path) {
        _self.output_path.set('value', _self.defaultPath);
      }
      this.onStrategyChange();
      this._started = true;
      this.form_flag = false;
      try {
        this.intakeRerunForm();
      } catch (error) {
        console.error(error);
      }
    },

    getReferenceMode: function () {
      if (this.reference_mode_fasta && this.reference_mode_fasta.get('checked')) {
        return 'fasta';
      }
      return 'genbank';
    },

    onReferenceModeChange: function () {
      const mode = this.getReferenceMode();
      if (this.reference_genbank_row) {
        this.reference_genbank_row.style.display = (mode == 'genbank') ? 'block' : 'none';
      }
      if (this.reference_fasta_row) {
        this.reference_fasta_row.style.display = (mode == 'fasta') ? 'block' : 'none';
      }
      this.checkParameterRequiredFields();
    },

    onReferenceFieldChange: function () {
      this.checkParameterRequiredFields();
    },

    validateGenbankAccession: function (accession) {
      if (!accession) return false;
      const value = String(accession).trim().toUpperCase();
      if (!value) return false;
      const accessionPattern = /^[A-Z]{1,4}_?[A-Z]{0,4}\d+(?:\.\d+)?$/;
      const accessionList = value.split(';');
      return accessionList.every(function (item) {
        const token = item.trim();
        return token && accessionPattern.test(token);
      });
    },

    validateReferenceFastaPath: function (pathValue) {
      if (!pathValue) return false;
      const value = String(pathValue).trim().toLowerCase();
      return /\.(fa|fna|fasta)$/.test(value);
    },

    getSimilarReferenceInputPath: function () {
      // Priority: reads first (what the user is assembling), then reference FASTA if set.
      if (this.read1 && this.read1.get('value')) return this.read1.get('value');
      if (this.read && this.read.get('value')) return this.read.get('value');
      if (this.reference_fasta_file && this.reference_fasta_file.get('value')) {
        return this.reference_fasta_file.get('value');
      }
      return null;
    },

    onFindSimilarReference: function () {
      if (!this.similarReferenceDialog) return;
      this.similarReferenceDialog.show();
      this.runSimilarReferenceSearch();
    },

    runSimilarReferenceSearch: function () {
      const path = this.getSimilarReferenceInputPath();
      domConstruct.empty(this.similarReferenceResults);

      if (!path) {
        this.similarReferenceStatus.innerHTML = 'Select a read library or reference FASTA file first.';
        return;
      }

      // Read params from dialog widgets, fall back to config defaults
      const cfg = this.similarGenomeFinderConfig;
      const pvalue = this.similarRef_pvalue ? parseFloat(this.similarRef_pvalue.get('value')) : cfg.maxPvalue;
      const distance = this.similarRef_distance ? parseFloat(this.similarRef_distance.get('value')) : cfg.maxDistance;
      const maxHits = this.similarRef_maxHits ? parseInt(this.similarRef_maxHits.get('value')) : cfg.maxHits;
      const scopeIsRef = this.similarRef_scopeRef ? this.similarRef_scopeRef.get('checked') : (cfg.scope === 'ref');
      const includeRef = scopeIsRef ? 1 : 0;

      this.similarReferenceStatus.innerHTML = 'Searching...';

      const rpc = {
        method: 'Minhash.compute_genome_distance_for_fasta2',
        params: [path, pvalue, distance, maxHits, includeRef, includeRef, cfg.includeBacterial, cfg.includeViral],
        version: '1.1',
        id: String(Math.random()).slice(2)
      };

      xhr.post(window.App.genomedistanceServiceURL, {
        headers: {
          Authorization: window.App.authorizationToken || '',
          Accept: 'application/json'
        },
        handleAs: 'json',
        data: JSON.stringify(rpc)
      }).then(lang.hitch(this, function (res) {
        if (res && res.error) {
          this.similarReferenceStatus.innerHTML = 'Service error: ' + (res.error.message || JSON.stringify(res.error));
          return;
        }
        const hits = (res && res.result && res.result[0]) || [];
        this.fetchSimilarReferenceMetadata(hits);
      }), lang.hitch(this, function (err) {
        this.similarReferenceStatus.innerHTML = 'Error: ' + ((err && err.message) || 'Request failed');
      }));
    },

    fetchSimilarReferenceMetadata: function (hits) {
      if (!hits || hits.length === 0) {
        this.similarReferenceStatus.innerHTML = 'No similar genomes found. Try loosening the distance/p-value thresholds.';
        return;
      }
      const genomeIds = hits.map(function (h) { return h[0]; });
      xhr.post(window.App.dataAPI + 'genome/', {
        headers: {
          Authorization: window.App.authorizationToken || '',
          Accept: 'application/json',
          'Content-Type': 'application/solrquery+x-www-form-urlencoded',
          'X-Requested-With': null
        },
        handleAs: 'json',
        data: { rows: hits.length, q: 'genome_id:(' + genomeIds.join(' OR ') + ')' }
      }).then(lang.hitch(this, function (res) {
        const metaById = {};
        (res || []).forEach(function (g) { metaById[g.genome_id] = g; });
        const rows = hits.map(function (h) {
          const meta = metaById[h[0]] || {};
          const accession = ((meta.genbank_accessions || '').split(',')[0] || '').trim();
          return {
            genome_id: h[0],
            distance: h[1],
            pvalue: h[2],
            name: meta.genome_name || h[0],
            accession: accession
          };
        });
        this.renderSimilarReferenceTable(rows);
      }), lang.hitch(this, function () {
        this.similarReferenceStatus.innerHTML = 'Error loading genome metadata from data API.';
      }));
    },

    renderSimilarReferenceTable: function (rows) {
      const _self = this;
      domConstruct.empty(this.similarReferenceResults);
      this.similarReferenceStatus.innerHTML = 'Found ' + rows.length + ' similar genomes. Click Use to populate the reference.';

      const table = domConstruct.create('table', { style: 'width:100%;border-collapse:collapse;font-size:0.9em;' }, this.similarReferenceResults);
      const thead = domConstruct.create('thead', {}, table);
      const headRow = domConstruct.create('tr', {}, thead);
      ['Genome Name', 'GenBank', 'Distance', 'P-value', ''].forEach(function (h) {
        domConstruct.create('th', { innerHTML: h, style: 'text-align:left;border-bottom:1px solid #ccc;padding:4px;' }, headRow);
      });
      const tbody = domConstruct.create('tbody', {}, table);
      rows.forEach(function (r) {
        const tr = domConstruct.create('tr', { style: 'border-bottom:1px solid #eee;' }, tbody);
        domConstruct.create('td', { innerHTML: r.name, style: 'padding:4px;' }, tr);
        domConstruct.create('td', { innerHTML: r.accession || '—', style: 'padding:4px;font-family:monospace;' }, tr);
        domConstruct.create('td', { innerHTML: r.distance, style: 'padding:4px;' }, tr);
        domConstruct.create('td', { innerHTML: r.pvalue, style: 'padding:4px;' }, tr);
        const actionCell = domConstruct.create('td', { style: 'padding:4px;' }, tr);
        const btn = domConstruct.create('button', {
          type: 'button',
          innerHTML: 'Use',
          disabled: !r.accession
        }, actionCell);
        on(btn, 'click', function () { _self.useSimilarReference(r.accession); });
      });
    },

    useSimilarReference: function (accession) {
      if (!accession) return;
      if (this.reference_mode_genbank) {
        this.reference_mode_genbank.set('checked', true);
      }
      if (this.reference_genbank_accession) {
        this.reference_genbank_accession.set('value', accession);
      }
      if (this.similarReferenceDialog) {
        this.similarReferenceDialog.hide();
      }
      this.checkParameterRequiredFields();
    },

    closeSimilarReferenceDialog: function () {
      if (this.similarReferenceDialog) {
        this.similarReferenceDialog.hide();
      }
    },

    inputTypeChanged: function () {
      if (this.pairedReadCheck.checked === true) {
        document.getElementById('pairedReadLibraryBox').style.display = 'block';
        document.getElementById('singleReadLibraryBox').style.display = 'none';
        document.getElementById('sraAccessionBox').style.display = 'none';
      } else if (this.singleReadCheck.checked === true) {
        document.getElementById('pairedReadLibraryBox').style.display = 'none';
        document.getElementById('singleReadLibraryBox').style.display = 'block';
        document.getElementById('sraAccessionBox').style.display = 'none';
      } else {
        document.getElementById('pairedReadLibraryBox').style.display = 'none';
        document.getElementById('singleReadLibraryBox').style.display = 'none';
        document.getElementById('sraAccessionBox').style.display = 'block';
      }
    },

    openJobsList: function () {
      Topic.publish('/navigate', { href: '/job/' });
    },

    getValues: function () {
      let values = this.inherited(arguments);

      let assemblyValues = {
        strategy: values.strategy,
        output_path: values.output_path,
        output_file: values.output_file
      };

      if (values.strategy === 'irma') {
        assemblyValues.module = values.module;
      } else if (values.strategy === 'reference-guided') {
        const mode = this.getReferenceMode();
        assemblyValues.strategy = 'reference_guided';
        assemblyValues.reference_type = mode;
        if (mode === 'genbank') {
          assemblyValues.reference_genbank_accession = values.reference_genbank_accession;
        } else if (mode === 'fasta') {
          assemblyValues.reference_fasta_file = values.reference_fasta_file;
        }
      }

      if (values.inputType === 'pairedRead') {
        assemblyValues.paired_end_lib = {
          read1: values.read1,
          read2: values.read2
        };
      } else if (values.inputType === 'singleRead') {
        assemblyValues.single_end_lib = {
          read: values.read
        };
      } else {
        if (this.isSRAValid) {
          // Validate SRR accession id
          //this.onAddSRR();
          assemblyValues.sra_id = values.srr_accession;
        } else {
          return false;
        }
      }

      return assemblyValues;
    },

    onReset: function () {
      domClass.remove(this.domNode, 'Working');
      domClass.remove(this.domNode, 'Error');
      domClass.remove(this.domNode, 'Submitted');
    },

    checkParameterRequiredFields: function () {
      const hasOutputPath = this.output_path.get('value');
      const hasOutputName = this.output_file.get('displayedValue');
      const strategy = this.strategy && this.strategy.get('value');
      let hasReference = true;

      if (strategy === 'reference-guided') {
        if (this.reference_section) {
          this.reference_section.style.display = 'block';
        }
        if (this.irma_module_row) {
          this.irma_module_row.style.display = 'none';
        }
        const mode = this.getReferenceMode();
        if (mode === 'genbank') {
          const accession = this.reference_genbank_accession && this.reference_genbank_accession.get('value');
          hasReference = this.validateGenbankAccession(accession);
          if (this.reference_genbank_accession) {
            this.reference_genbank_accession.set('state', hasReference || !accession ? '' : 'Error');
          }
        } else if (mode === 'fasta') {
          const fastaPath = this.reference_fasta_file && this.reference_fasta_file.searchBox && this.reference_fasta_file.searchBox.get('value');
          hasReference = this.validateReferenceFastaPath(fastaPath);
          if (this.reference_fasta_file && this.reference_fasta_file.searchBox && typeof this.reference_fasta_file.searchBox.set === 'function') {
            this.reference_fasta_file.searchBox.set('state', hasReference || !fastaPath ? '' : 'Error');
          }
        }
      } else {
        if (this.reference_section) {
          this.reference_section.style.display = 'none';
        }
        if (this.irma_module_row) {
          this.irma_module_row.style.display = 'block';
        }
      }

      if (hasOutputPath && hasOutputName && hasReference) {
        this.validate();
      } else {
        if (this.submitButton) {
          this.submitButton.set('disabled', true);
        }
      }
    },

    onOutputPathChange: function (val) {
      this.inherited(arguments);
      this.checkParameterRequiredFields();
    },

    checkOutputName: function (val) {
      this.inherited(arguments);
      this.checkParameterRequiredFields();
    },

    onStrategyChange: function () {
      if (this.strategy.get('value') === 'reference-guided') {
        this.onReferenceModeChange();
      }
      this.checkParameterRequiredFields();
    },

    onSRRChange: function () {
      const accession = this.srr_accession.get('value');
      this.isSRAValid = false;

      if (!accession.match(/^[a-z]{3}[0-9]+$/i)) {
        this.srr_accession_validation_message.innerHTML = 'Please provide a valid SRA number';
      } else {
        this.srr_accession.set('disabled', true);
        this.srr_accession_validation_message.innerHTML = 'Validating ' + accession + '.';

        try {
          xhr.get(lang.replace(this.srrValidationUrl, [accession]),
            {
              sync: false,
              headers: { 'X-Requested-With': null },
              timeout: 15000,
              handleAs: 'text'
            }).then(
            lang.hitch(this, function (response) {
              const jsonResponse = JSON.parse(response);

              if (jsonResponse.esearchresult.count === '0') {
                this.srr_accession_validation_message.innerHTML = 'The accession is not a valid id.';
              } else {
                this.srr_accession_validation_message.innerHTML = 'The accession is a valid id.';
                this.isSRAValid = true;
              }

              this.srr_accession.set('disabled', false);
            })
          );
        } catch (e) {
          console.error(e);
          this.srr_accession_validation_message.innerHTML = 'Something went wrong. Please try again.';
        }
      }
    },

    setStrategy: function (strategy) {
      this.strategy.set('value', strategy);
    },

    intakeRerunForm: function () {
      // assuming only one key
      const service_fields = window.location.search.replace('?', '');
      const rerun_fields = service_fields.split('=');
      let rerun_key;
      if (rerun_fields.length > 1) {
        rerun_key = rerun_fields[1];
        const sessionStorage = window.sessionStorage;
        if (sessionStorage.hasOwnProperty(rerun_key)) {
          try {
            const jobData = JSON.parse(sessionStorage.getItem(rerun_key));

            if (jobData['strategy']) {
              const strategyValue = jobData['strategy'] === 'reference_guided' ? 'reference-guided' : jobData['strategy'];
              this.strategy.set('value', strategyValue);
            }
            if (jobData['module']) {
              this.module.set('value', jobData['module']);
            }
            if (jobData['output_path']) {
              this.output_path.set('value', jobData['output_path']);
            }
            if (jobData['reference_type'] === 'fasta' && this.reference_mode_fasta) {
              this.reference_mode_fasta.set('checked', true);
            } else if (jobData['reference_type'] === 'genbank' && this.reference_mode_genbank) {
              this.reference_mode_genbank.set('checked', true);
            }
            if (jobData['reference_genbank_accession'] && this.reference_genbank_accession) {
              this.reference_genbank_accession.set('value', jobData['reference_genbank_accession']);
            }
            if (jobData['reference_fasta_file'] && this.reference_fasta_file) {
              this.reference_fasta_file.set('value', jobData['reference_fasta_file']);
            }
            if (jobData['srr_id'] || jobData['sra_id']) {
              this.srr_accession.set('value', jobData['srr_id'] || jobData['sra_id']);
              this.sraAccessionCheck.set('checked', true);
              this.onSRRChange();
            } else if (jobData['paired_end_lib']) {
              this.read1.set('value', jobData['paired_end_lib'].read1);
              this.read2.set('value', jobData['paired_end_lib'].read2);
              this.pairedReadCheck.set('checked', true);
            } else if (jobData['single_end_lib']) {
              this.read.set('value', jobData['single_end_lib'].read);
              this.singleReadCheck.set('checked', true);
            }
            this.form_flag = true;
          } catch (error) {
            console.log('Error during intakeRerunForm: ', error);
          } finally {
            sessionStorage.removeItem(rerun_key);
          }
        }
      }
    }
  });
});
