Testing
=======

Tests are performed using `Cypress <https://www.cypress.io/>`_.  Once
a :ref:`local development server<local_development_server>` is
running, the Cypress UI can be launched with:

.. code-block:: shell

   ./node_modules/.bin/cypress open

By default Cypress looks for the server at ``localhost:3000``, which
is where ``npm start`` listens.


.. _testing_zipfile_with_Cypress:

Testing a deployment zipfile
----------------------------

To test a :ref:`deployment zipfile<making_deployment_zipfile>`, the
base URL for Cypress to use for testing can be overridden on the
command line.  For example, if you are using the provided
:ref:`Docker-based mechanism for serving a deployment
zipfile<testing_deployment_zipfile>`, then a command along the lines
of

.. code-block:: shell

   CYPRESS_BASE_URL=http://localhost:5888/beta/g112233445566/app/ ./node_modules/.bin/cypress open

will launch the interactive Cypress UI, and

.. code-block:: shell

   CYPRESS_BASE_URL=http://localhost:5888/beta/g112233445566/app/ ./node_modules/.bin/cypress run

will run the Cypress tests in headless mode from the command line.

For copy/paste convenience, these command-lines are written to stdout
by the ``serve-zipfile.sh`` script, as outlined in the documentation
for the :ref:`Docker-based mechanism for serving a deployment
zipfile<testing_deployment_zipfile>`.
