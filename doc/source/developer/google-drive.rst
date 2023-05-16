Integration with Google Drive
=============================

Pytch can save (“export”) projects to, and load (“import”) projects
from, Google Drive.  This section summarises the design and
implementation of this feature.


What’s stored
-------------

Export/import uses :ref:`the same zipfile format <Storage as zipfile>`
as “download” / “upload”.  When exporting, the filename is
automatically generated along the lines of

* ``My cool project (exported 20230516T160905).zip``


API objects
-----------

Google Drive operations are provided through API objects, to allow
Cypress-based testing of the UI flows under different error
conditions.

The real Google API has a set-up phase where Google-provided scripts
are loaded.  There is therefore a *boot* process which returns an
object capable of performing the Google Drive operations.  (Or throws
an exception if something goes wrong.)

Google Drive Boot API
~~~~~~~~~~~~~~~~~~~~~

Provides just the method ``boot()``, returning an object providing the
following API:

Google Drive API
~~~~~~~~~~~~~~~~

Provides ``acquireToken()``, ``getUserInfo()``, ``importFiles()`` and
``exportFile()`` methods.  See docstrings in the code for details.


Authentication flow
-------------------

There is an authentication and consent flow, mostly handled by
Google-provided code.  Integration with the Pytch webapp is
complicated by the fact that we get a callback if the user gives or
refuses consent, but no callback if the user just closes the pop-up.
There is therefore a separate “Cancel” operation in the modal the app
shows while waiting for the Google pop-up to invoke one of our
callbacks.  Communication regarding cancellation between the in-app
modal and the Google pop-up is handled by an ``AbortController``.


Google Cloud project
--------------------

The system needs to be registered with Google, saying which API
families are permitted, what sorts of user information it will want to
access, and so on.  This is set up manually through Google’s web
console.

API keys and other identifiers: the ``.env`` file
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Various identifiers are needed when communicating with Google.

* Client ID (env.var ``REACT_APP_GOOGLE_CLIENT_ID``)
* App ID (env.var ``REACT_APP_GOOGLE_APP_ID``)
* API key (env.var ``REACT_APP_GOOGLE_API_KEY``)

These are stored in a ``.env`` file which is not part of the repo.


Testing
-------

There is a mock implementation of the two APIs.  It can be configured
to behave in certain ways so that Cypress can test the UI flow under
different conditions.


Choice of real vs mock APIs
---------------------------

The real Google API objects are used for production builds and also
for the development server when a particular React environment
variable is set:

* ``REACT_APP_USE_REAL_GOOGLE_DRIVE=yes``

Otherwise, the mock API objects are used, to allow Cypress testing.
This does mean that you must stop and re-start the development server
in order to switch between working with the real Google Drive and
running tests.
