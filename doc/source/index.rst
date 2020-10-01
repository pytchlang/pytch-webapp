..
   Pytch Web App documentation master file, created by
   sphinx-quickstart on Thu Oct  1 08:50:00 2020.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

   To set up for development:

      virtualenv -p python3 venv
      source venv/bin/activate
      pip install sphinx sphinx-rtd-theme sphinx-autobuild

   Then

      sphinx-autobuild --re-ignore '/\.#' source build/html

   will launch a live-reload server to view the results.


Welcome to Pytch Web App's documentation!
=========================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   internals/index
