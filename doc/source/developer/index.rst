Webapp (developer guide)
========================

The webapp is a *React* (v18) app, using *Easy-Peasy* (v5) for state
maintenance.  We use *Bootstrap* (v5) for UI primitives such as buttons.
Routing is done with *react-router*.  Testing is done with *Cypress*.

On-device storage of user projects is done with an *IndexedDB* instance,
accessed vie *Dexie.js*.


Top-level routes
----------------

The main user-visible “modes” of the webapp are as follows.  As well
as the below, there are two unlinked routes, intended to be sent as
links to interested parties: for suggesting a particular tutorial, and
for suggesting a particular demo.  These are not discussed here.

Welcome / home page
~~~~~~~~~~~~~~~~~~~

Overview of the app and the research project.  Some hand-chosen
“featured projects”.

Project list
~~~~~~~~~~~~

Queries the IndexedDB instance for the projects stored on the user’s
device, lists them, allows renaming or deleting (also in bulk).  Main
use-case is to open a particular project in the IDE.

Tutorial list
~~~~~~~~~~~~~

Lists the available self-paced tutorials, allowing the user to try the
finished version of each one, or set up a project which tracks that
tutorial, showing them the chapters of text, code diffs, etc.

Integrated development environment
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The main component of the app.  Allows the user to work with a
particular one of their projects.  User can edit code, manage project
assets (images and sounds), and run their program.  Contains the
following, in two possible layouts.  The user can also open a
full-screen mode, containing just the stage and its controls.

Editor
^^^^^^

Based on the Ace editor, augmented with custom completions and some
other keyboard commands.

Stage and controls
^^^^^^^^^^^^^^^^^^

Contains an HTML Canvas where the running project is rendered.

Information panel
^^^^^^^^^^^^^^^^^

A tabbed panel.  Tabs for: the project’s assets; output printed by
user programs; errors raised by user programs; self-paced tutorial
content if this project is tracking a tutorial.

(In local development mode, also contains a tab of diagnostics for
live-reload editing of code or tutorial content in an external
editor.)


Individual aspects of design
----------------------------

Not everything is covered here, but the details below might be useful
if you're working on the affected areas.

The interaction between the Skulpt Python runtime and the webapp is
:doc:`outlined within the VM developer docs
</vm/developer/integration-with-client>`.

.. toctree::
   :maxdepth: 1

   environment-variables
   tutorials
   testing
   zipfile-format
   google-drive
   assets-library
   content-hashes
