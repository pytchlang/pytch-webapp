Environment variables
=====================

The webapp relies on various environment variables.  Note that the
values of these variables are injected by the build system (Vite) to
make them available to the browser.

``VITE_VERSION_TAG``
  String to display in the header navigation bar, e.g., ``"v1.2.3"``.

``VITE_SKULPT_BASE``
  Initial portion of URL from which the Skulpt JavaScript files will
  be fetched.

``VITE_TUTORIALS_BASE``
  Initial portion of URL from which tutorial data (the index;
  individual tutorial content; assets used in tutorials) will be
  fetched.

``VITE_MEDIALIB_BASE``
  Initial portion of URL from which assets within the media library
  will be fetched.

``VITE_DEMOS_BASE``
  Initial portion of URL from which demo zipfiles will be fetched.

``VITE_DEPLOY_BASE_URL``
  "Root URL" of the **site** deployment.  The **webapp** is only one
  part of the site.  For example, the documentation lives within the
  site but outside the webapp.

``VITE_LIVE_RELOAD_WEBSOCKET``
  Whether (``"no"`` or ``"yes"``) to attempt to connect to a websocket
  server for live-reload of tutorial material.

``VITE_USE_REAL_GOOGLE_DRIVE``
  Whether (``"no"`` or ``"yes"``) to truly connect to the Google Drive
  API endpoints; if not, a test mock is instead.

``VITE_GOOGLE_API_KEY``
  If truly using the Google Drive API, the API Key to use.  Ignored
  otherwise.

``VITE_GOOGLE_APP_ID``
  If truly using the Google Drive API, the Application ID to use.
  Ignored otherwise.

``VITE_GOOGLE_CLIENT_ID``
  If truly using the Google Drive API, the Client ID to use.  Ignored
  otherwise.


How these variables get set
---------------------------

There are two settings where the app gets served:

Local development
~~~~~~~~~~~~~~~~~

The script ``dev-server-pieces.sh`` within the ``pytch-build`` repo
sets the environment variables and then launches
``dev-server-webapp.sh``.  That second script also heeds some
additional, optional environment variables:

``DEV_VITE_BASE_PATH``
  If set, this overrides the default Vite base path of ``"/"``.  If
  set, its value should both start with a ``/`` character and end
  with a ``/`` character.

``DEV_VITE_USE_PREVIEW``
  If set to ``"yes"``, launch the local webserver using ``vite build``
  followed by ``vite preview``.  (Otherwise, just use ``vite``.)
  Using ``vite build`` is slower, but a closer approximation to what
  happens when deploying a build.

``BROWSER``
  Can be set to ``"none"`` to suppress Vite's normal behaviour of
  launching the default browser.

The ``dev-server-webapp.sh`` script also reads environment
variables from the ``src/.env`` file within this repo.  That file sets
up the environment variables relating to the Google Drive integration.
For local development, the contents of ``.env`` usually specify either
a mock (via ``VITE_USE_REAL_GOOGLE_DRIVE=no``) or a development Google
cloud app (via its keys and IDs) which is set up to allow
``localhost`` origins.

Building deployment zipfile
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The script ``website-layer/make.sh`` in this ``pytch-webapp`` repo
sets the paths relative to the value of the ``DEPLOY_BASE_URL``
environment variable, which in turn is provided by the ``make.sh``
script in the top-level ``pytch-releases`` repo.  The ``make.sh``
script works out whether you're building a versioned release or a beta
and sets ``DEPLOY_BASE_URL`` accordingly.

(That variable should perhaps be named ``DEPLOY_BASE_PATH``; todo?)
