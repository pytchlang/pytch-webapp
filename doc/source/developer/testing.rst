Testing
=======

Tests are performed using `Cypress <https://www.cypress.io/>`_.  Once
a local development server is running (see documentation under build
system), the Cypress UI can be launched with:

.. code-block:: shell

   ./node_modules/.bin/cypress open

By default cypress looks for the server at ``localhost:3000``, which
is where ``npm start`` listens.


Testing a deployment zipfile
----------------------------

To test a deployment zipfile (see build system docs), the base URL for
testing can be overridden on the command line.  For example:

.. code-block:: shell

   CYPRESS_BASE_URL=http://localhost:5888/beta/build-20201123084118Z/app ./node_modules/.bin/cypress open

if using the Docker-based mechanism for serving a deployment zipfile
outlined in the build system docs.
