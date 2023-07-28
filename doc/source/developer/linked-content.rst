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
