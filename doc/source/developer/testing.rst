Testing
=======

Tests are performed using `Cypress <https://www.cypress.io/>`_.  Once
a :ref:`local development server<local_development_server>` is
running, the Cypress UI can be launched with:

.. code-block:: shell

   ./node_modules/.bin/cypress open

By default cypress looks for the server at ``localhost:3000``, which
is where ``npm start`` listens.


.. _testing_zipfile_with_Cypress:

Testing a deployment zipfile
----------------------------

To test a :ref:`deployment zipfile<making_deployment_zipfile>`, the
base URL for Cypress to use for testing can be overridden on the
command line.  For example:

.. code-block:: shell

   CYPRESS_BASE_URL=http://localhost:5888/beta/build-20201123084118Z/app ./node_modules/.bin/cypress open

if using the provided :ref:`Docker-based mechanism for serving a
deployment zipfile<testing_deployment_zipfile>`.
