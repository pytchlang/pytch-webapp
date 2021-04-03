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
