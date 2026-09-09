#!/bin/bash

set -eu
cd "$(dirname "$0")"

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/d3.v3.min.js > bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/sax.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/jquery-ui.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/FileSaver.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/phyloxml.js >> bundle2.js

#/bin/cat ../archaeopteryx/archaeopteryx-dependencies/rgbcolor.js >> bundle2.js

/bin/cat ../rgbcolor.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/stackblur.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-dependencies/canvg.js >> bundle2.js

# Archaeopteryx 3 captures D3 v7 at initialization. Keep the global D3 v3
# instance for legacy widgets; v7 must start with a fresh object because its
# UMD loader otherwise merges into (and corrupts) the existing global.
cat >> bundle2.js <<'JS'

;(function (root) {
  var legacyD3 = root.d3;
  try {
    root.d3 = {};
JS

/bin/cat ../archaeopteryx/archaeopteryx-js/docs/lib/d3.v7.min.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-js/forester.js >> bundle2.js

/bin/cat ../archaeopteryx/archaeopteryx-js/archaeopteryx.js >> bundle2.js

cat >> bundle2.js <<'JS'

  } finally {
    root.d3 = legacyD3;
  }
})(window);
JS
