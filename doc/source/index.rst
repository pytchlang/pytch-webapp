..
   To set up for standalone development:

   In the "doc/" directory:

      python3 -m venv venv
      source venv/bin/activate
      pip install --upgrade pip
      pip install -r requirements_dev.txt

   Then, within "doc/" directory,

      sphinx-autobuild --re-ignore '/\.#' source build/html

   will launch a live-reload server to view the results.  See the developer docs
   for the pytch-website repository for how to build these docs into the main
   website docs.


Using the Pytch Web App
=======================

.. caution::

   This index will not appear in the final website documentation.  It is just
   for standalone development of the webapp docs.

.. toctree::
   :maxdepth: 1

   user/index
   developer/index
