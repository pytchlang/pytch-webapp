Fingerprints and content hashes
===============================

These terms are similar, but have distinct meanings in the codebase:

Fingerprint
  A string of text computed from an object such that if two objects
  have the same fingerprint, those objects have the same content.
  (Well, except for hash collisions.)

Content hash
  The lower-case hexadecimal representation of a SHA256 hash (of some
  input related to the object, often its fingerprint.)

Example
-------

The fingerprint of a project is a string of the form

.. code-block:: text

   program=flat/272b26e4f3edbdf5586bae5d83fe9d24b93a8df77c60c774a82f963dbcff61b8
   assets=8c87⋯f254/9648⋯01bd/ecfe⋯8f37/fa7a⋯bd28

The content-hash of a project is the SHA256 sum of its fingerprint.

See the code for the details of what goes into the two parts of a
project's fingerprint.
