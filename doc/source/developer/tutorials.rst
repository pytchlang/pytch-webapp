Tutorials
=========

A tutorial arrives as a lump of HTML, where each chapters is its own
``DIV`` within a top-level ``DIV``.  The first 'chapter' is the *front
matter*, which contains the introduction and usually a marker for
where a '*Try the project!*' button should be placed.  [In future, we
might change this representation to JSON or similar, because the
current arrangement requires jumping through a few hoops to get it
into the React world.]

The webapp records which tutorial (if any) a given project is
*tracking*.  The information stored is the *slug* of the tutorial and
the current chapter index.  When such a project is made active, the
actual tutorial content is loaded from the backend, as identified by
the slug.  [In future, a more formal identifier might be used instead
of this slug.]


List of available tutorials
---------------------------

On first presentation of the tutorials list, a ``tutorial-index.html``
file is fetched.  The base URL is controlled by the environment
variable ``REACT_APP_TUTORIALS_BASE`` and is different for development
vs production deployments.

That HTML file contains one ``DIV`` of class ``tutorial-summary`` per
available tutorial, which contains various pieces of metadata as well
as the actual content of the summary, usually including reference to a
screenshot.


Active project's tracked tutorial
---------------------------------

If there is a currently-active project, this state is held at
``activeProject.project``.  Within this, there is optionally::

   activeProject.project.trackedTutorial

containing the *content* and *active chapter index*.

The chapter index is initialised when loading a project, updated as
the user navigates through the tutorial, and saved to backend storage
when the user clicks *Save*.  It is also set by the live-reload
mechanism; see next.


Live-reload (for tutorial developers)
-------------------------------------

When using the live-reload facility, the lump of HTML is sent over the
web-socket to the browser, rather than the browser requesting it.
From there, the processing is mostly the same.  One difference is that
the in-development HTML can contain a marker signifying which chapter
is currently being worked on, and the webapp selects that chapter, and
sets the content of the code editor to be the code as of the most
recent commit mentioned strictly before the start of that chapter.
