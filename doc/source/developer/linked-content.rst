Linked content for a project
============================

For classroom use, it is helpful for students to be able to start work
on an existing *specimen* of code.  Their task might be to modify it
in some way, or answer some questions about how it works.

A Pytch project, as stored in the user's project list, therefore has
*linked content*, which can be of various kinds.  There is a
``"none"`` kind to represent the case where there is no linked
content.  Currently the only other kind of linked content is
``"specimen"``, although it's possible that tutorial content will be
folded into this model in the future.


Linked specimen
---------------

A project can be linked to a *specimen* project.  When such a project
is created, it is identical to the referred-to specimen.

Creation of a specimen-linked project
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

It must be easy for a student, in a classroom-like environment, to
create a project from a particular specimen.  However, we want to
avoid the situation where the user ends up with lots of identical
projects cluttering up their project list.  Therefore there is
slightly fiddly logic by which the app decides whether to create a new
project for the user, open an existing one, or give that choice to the
user.  This logic lives in the ``ProjectFromSpecimenFlow`` model
slice.

If the app needs the user to make a choice from different options
(e.g., create a new project vs open an existing one), this is handled
by the component ``ProjectFromSpecimenFlow``.

The user visits a URL like

.. code-block:: text

   https://pytch.org/app/lesson/course-1/week-1

where the ``course-1/week-1`` portion is free-form.  The single-page
app has a route ``lesson/*``, the handler of which makes a request for
the specimen project at, for this example, the URL

.. code-block:: text

   https://pytch.org/lesson-specimens/course-1/week-1.zip

This might, on the server side, be implemented with ``week-1.zip``
being a symbolic link to a file whose name is based on the content
hash of the project; see below.

The lesson content is kept outside the main app deployment to allow
independent development and updates.  For local development, yet
another local HTTP server is required.


Loading of linked content
-------------------------

When the user is working with a project which has non-trivial (i.e.,
not of kind ``"none"``) linked content, an information bar appears
above the editor pane.  This shows the title of the linked specimen,
and has a drop-down for various actions relating to the specimen.  The
linked content is loaded (asynchronously) as part of fetching the
project from the IndexedDB store.

Specimen linked content
~~~~~~~~~~~~~~~~~~~~~~~

The specimen is loaded via a URL based on the content hash of the
specimen project.  This means that the server must provide the project
zip in response to a URL like

.. code-block:: text

   https://pytch.org/lesson-specimens/_by_content_hash_/a1b2⋯a8f9.zip

as well as via whatever path such as
``lesson-specimens/course-1/week-1.zip`` the content was originally
loaded from.
