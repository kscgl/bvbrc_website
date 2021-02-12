require({cache:{
'url:p3/widget/templates/VariantResources.html':"<div>\n    <div class=\"column-sub\"></div>\n\n    <div class=\"column-prime\" style=\"width:80%\">\n        <div class=\"section\">\n            <h3 class=\"close2x section-title\"><span class=\"wrap\">SARS-CoV-2 Resources</span></h3>\n            <table class=\"p3basic striped far2x\">\n                <thead>\n                  <tr>\n                    <th>Resource</th>\n                    <th>Description</th>\n                    <th>Data Types</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr>\n                    <td><a href=\"https://www.beiresources.org/BEIHighlights1.aspx?ItemId=79&ModuleId=14004\" target=_blank>BEI SARS-CoV-2 Resources</a></td>\n                    <td>Information about SARS-CoV-2 strains and reagents.</td>\n                    <td>biomaterial</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://jbloomlab.github.io/SARS-CoV-2-RBD_DMS/\" target=_blank>Bloom Lab: ACE-2 Binding affinities</a></td>\n                    <td>\n                      Deep Mutational Scanning of SARS-CoV-2 Receptor Binding Domain Reveals Constraints on Folding and ACE2 Binding\n                      (<a href=\"https://www.cell.com/cell/fulltext/S0092-8674(20)31003-5?_returnURL=https%3A%2F%2Flinkinghub.elsevier.com%2Fretrieve%2Fpii%2FS0092867420310035%3Fshowall%3Dtrue\" target=_blank>Reference</a>)\n                    </td>\n                    <td>Experiemntal data on point mutations affecting receptor binding</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://app.terra.bio/#workspaces/pathogen-genomic-surveillance/COVID-19\" target=_blank>Broad Terra cloud commons for pathogen surveillance</a></td>\n                    <td>The Broad Terra cloud workspace with COVID-19 genomics data and orkflows for genome assembly, quality control, metagenomic classification, and aggregate statistics.</td>\n                    <td>genomics</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://github.com/CDCgov/SARS-CoV-2_Sequencing\" target=_blank>CDC SARS-CoV-2 Sequencing Resources</a></td>\n                    <td>rowd-sourced collection of information, documentation, protocols and other resources for public health laboratories intending to sequence SARS-CoV-2 samples.</td>\n                    <td>protocols</td>\n                  </tr>\n\n                  <!-- <tr>\n                    <td><a href=\"https://www.cdc.gov/coronavirus/2019-ncov/cases-updates/variant-surveillance.html\" target=_blank>CDC Genomic Surveillance for SARS-CoV-2 Variants</a></td>\n                    <td></td>\n                    <td></td>\n                  </tr> -->\n\n                  <tr>\n                    <td><a href=\"https://bigd.big.ac.cn/ncov/?lang=en\" target=_blank>China National Center for Bioinformation's 2019 Novel Coronavirus Resource (2019nCoVR)</a></td>\n                    <td>A comprehensive resource on COVID-19, combining up-to-date information on all published sequences, mutation analyses, literatures and others.</td>\n                    <td>genomics, variant tracking, literature</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://coronavirus3d.org/\" target=_blank>Coronavirus 3D</a></td>\n                    <td>Web-based viewer for 3D visualization and analysis of the SARS-CoV-2 protein structures with respect to the CoV-2 mutational patterns</td>\n                    <td>protein structures</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"http://cov-glue.cvr.gla.ac.uk/#/home\" target=_blank>CoV-GLUE</a></td>\n                    <td>Amino acid variation database of amino acid replacements, insertions and deletions</td>\n                    <td>variant tracking</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://covariants.org\" target=_blank>CoVariants</a></td>\n                    <td>SARS-CoV-2 variant tracking dashboard largely based on NEXTSTRAIN</td>\n                    <td>Multiple: phylogenomics, variant tracking</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://covidcg.org/?tab=group\" target=_blank>COVID-19 CoV Genetics Browser</a></td>\n                    <td>Track transmission, evolution, emergence, immune interactions, diagnostics, therapeutics & vaccines</td>\n                    <td>variant tracking</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://registry.opendata.aws/ncbi-covid-19/\" target=_blank>COVID-19 Genome Sequence Dataset on Registry of Open Data on AWS</a></td>\n                    <td>A centralized sequence repository for all strains of novel corona virus (SARS-CoV-2) submitted to NCBI. Included are both the original sequences submitted by the principal investigator as well as SRA-processed sequences that require the SRA Toolkit for analysis.</td>\n                    <td>genomics</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"http://filogeneti.ca/covizu/\" target=_blank>CoVizu</a></td>\n                    <td>Near real-time visualization of hCoV-19 genomic variation</td>\n                    <td>&nbsp;</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://www.gisaid.org/\" target=_blank>GISAID</a></td>\n                    <td>International database of hCoV-19 genome sequences and related clinical and epidemiological data</td>\n                    <td>genomics</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://www.gisaid.org/hcov19-variants/\" target=_blank>GISAID variant tracking page</a></td>\n                    <td>GISAID's variant tracking dashboard</td>\n                    <td>Strains, map, graph, metadata, </td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"http://www.iedb.org/\" target=_blank>Immune Epitope Database (IEDB)</a></td>\n                    <td>Experimental data on SARS-CoV-2 antibodies and T cell epitopes</td>\n                    <td>immunology</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://cov.lanl.gov/content/index\" target=_blank>LANL COVID-19 Viral Genome Analysis</a></td>\n                    <td>Analyses and tools for exploring accruing mutations in SARS-CoV-2, geographically and over time, with an emphasis on the Spike protein.</td>\n                    <td>variant tracking</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://www.ncbi.nlm.nih.gov/sars-cov-2/\" target=_blank>NCBI SARS-CoV-2 Resources</a></td>\n                    <td>SARS-CoV-2 related data and resources at NCBI, such as nucleotide and protein sequences from GenBank and RefSeq, genomic and metagenomic read sets in SRA, BLAST, PubMed, Clinical Trials.  </td>\n                    <td>genomics, literature</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://clades.nextstrain.org/\" target=_blank>NextClade</a></td>\n                    <td>Tool to perform clade assignment, mutation calling, and sequence quality checks/td>\n                    <td>phylogenomics</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://nextstrain.org/ncov\" target=_blank>Nextstrain COVID-19 genetic epidemiology</a></td>\n                    <td>Open-source SARS-CoV-2 genome data and analytic and visualization tools</td>\n                    <td>phylogenomics, variant tracking</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://cov-lineages.org/index.html\" target=_blank>Pango Lineages</a></td>\n                    <td>A dynamic nomenclature for SARS-CoV-2 lineages. Pangolin, a tool for global lineage assignment. </td>\n                    <td>phylogenomics, variant tracking</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://reactome.org/\" target=_blank>Reactome</a></td>\n                    <td>Open-source curated and peer-reviewed pathway database, including human coronavirus infection pathways. Tools for the visualization, interpretation and analysis of pathway knowledge to support basic research, genome analysis, modeling, systems biology and education.</td>\n                    <td>genomics, visualization</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://genome.ucsc.edu/cgi-bin/hgTracks?db=wuhCor1\" target=_blank>UCSC SARS-CoV-2 Genome Browser</a></td>\n                    <td>The UCSC SARS-CoV-2 genome browser and COVID-19 lung gene expression datasets. </td>\n                    <td>genome browser</td>\n                  </tr>\n\n                  <tr>\n                    <td><a href=\"https://covid-19.uniprot.org/uniprotkb?query=*\" target=_blank>UniProtKB SARS-CoV-2</a></td>\n                    <td>SARS-CoV-2 proteins and annotations</td>\n                    <td>protein annotation</td>\n                  </tr>\n                </tbody>\n              </table>\n        </div>\n    </div>\n\n    <div class=\"column-opt\"></div>\n</div>\n"}});
define("p3/widget/VariantResources", [
  'dojo/_base/declare', 'dojo/text!./templates/VariantResources.html',
  'dijit/_WidgetBase', 'dijit/_Templated'

], function (
  declare, Template,
  WidgetBase, Templated
) {
  return declare([WidgetBase, Templated], {
    baseClass: 'VariantResources',
    disabled: false,
    templateString: Template,
    apiServiceUrl: window.App.dataAPI,

    startup: function () {
      if (this._started) {
        return;
      }
      this.inherited(arguments);
    }
  });
});