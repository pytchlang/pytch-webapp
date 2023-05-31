.. _Storage as zipfile:

Project storage as zipfile
==========================

We allow the user to download a project as a zipfile, to allow
moving a project from one device to another.


Structure of zipfile
--------------------

Version identifier
~~~~~~~~~~~~~~~~~~

At root, the zipfile contains a file ``version.json`` which is a JSON
representation of an object with just one integer-valued property,
``pytchZipfileVersion``.  The file is encoded as UTF-8 (which will
coincide with ASCII because all characters are in its range).

The remainder of the zipfile is laid out according to the version
number stored there.


Pytch zipfile version 1
-----------------------

A version-1 Pytch zipfile is laid out along the lines of the following
example:

.. code-block:: text

   version.json
   meta.json
   code/code.py
   assets/banana.jpg
   assets/whoosh.mp3

Metadata
~~~~~~~~

The ``meta.json`` file contains an object in JSON, with the following
properties.

.. code-block:: text

   {
     "projectName": "Chase the banana!"
   }

Project Python code
~~~~~~~~~~~~~~~~~~~

The project's Python code is stored in ``code/code.py``, encoded as
UTF-8.


Project assets
~~~~~~~~~~~~~~

The assets are stored in the ``assets`` directory, with each asset
having its own file.

The mime-type of an asset is determined solely by the extension of its
file.  So, for example, a file called "banana.jpg" which actually
contains MP3 data will cause trouble.


Pytch zipfile version 2
-----------------------

A version-2 Pytch zipfile is laid out along the lines of the following
example:

.. code-block:: text

   version.json
   meta.json
   code/code.py
   assets/metadata.json
   assets/files/banana.jpg
   assets/files/whoosh.mp3

Metadata and project Python code
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``meta.json`` file and the ``code/code.py`` files are as in
version 1.

Project assets
~~~~~~~~~~~~~~

The asset files are stored in the ``assets/files`` directory, with
each asset having its own file.

As is also the case in version 1, the mime-type of an asset is
determined solely by the extension of its file.  So, for example, a
file called "banana.jpg" which actually contains MP3 data will cause
trouble.

Asset transforms are stored as JSON in the file
``assets/metadata.json``.  That JSON represents an array of objects,
each of which has ``name`` and ``transform`` properties, as in this
example:

.. code-block:: json

   [
     {
       "name": "banana.jpg",
       "transform": {
         "targetType": "image",
         "originX": 0.8138888888888889,
         "originY": 0,
         "width": 0.18611111111111112,
         "height": 0.4311526878964568,
         "scale": 0.36271937853059033
       }
     },
     {
       "name": "whoosh.mp3",
       "transform": {
         "targetType": "audio"
       }
     }
   ]

The metadata should include information on exactly the same set of
assets as are in the zipfile.  Some missing information might be
gracefully handled, e.g., a missing ``transform`` property is OK
because a default 'no-op' transform can be used.  Future versions of
this metadata structure might include other properties.
