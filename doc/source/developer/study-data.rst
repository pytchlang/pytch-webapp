Instrumented version for evaluation studies
===========================================

A special build of Pytch can pseudonymously submit various user
interaction events to a server for later analysis.  The backend server
is in a separate repo ``pytch-study-db``.  This document outlines the
design of the front-end component.


Entities
--------

(Copied from ``pytch-study-db`` docs:)

There are multiple *studies*, each of which has multiple
*participants*.  A participant belongs to exactly one study.  Multiple
*sessions* can exist for a given participant.  A session has multiple
*events* associated with it.  A session can be valid or not; and has a
*creation time* and *last-access time*.  A session becomes *expired*
once sufficient time (4 hours) has passed without an access.  A study
is either *active* or not.  It is not possible to create a session for
an inactive study, although existing sessions are not invalidated if
their study changes from active to inactive.


Enabling study behaviour in front end
-------------------------------------

Must be built (or launched) with env.vars:

* ``REACT_APP_STUDY_API_BASE`` — the base URL for the backend server.

* ``REACT_APP_STUDY_SURVEY_URLS`` — two space-separated URL stems for
  third-party surveys.  The participant-code will be appended as a
  query parameter, e.g., ``?ParticipantCode=aaaa-bbbb``.

See ``pytch-study-db`` docs for more detail.


Browser-local storage of session token
--------------------------------------

Once the webapp has successfully joined a study, the session token is
stored in browser-local storage, ready for use if the user re-visits
the Pytch webapp from a fresh tab or browser session.


States of study participation
-----------------------------

The webapp tracks whether the user has joined a study by means of the
model slice::

  sessionState.status

(Something more descriptive than ``sessionState`` would have been
helpful — TODO: rename to something like ``usageStudySessionState``?)
This can have values as follows.  In the below, *participation-code*
is a code of the form ``a1b2-c3d4`` pseudonymously identifying a
particular participant within a study; *participation-info* is the
combination of a participation-code with a *session-token*, which is a
server-issued UUID representing a valid session.

``not-in-use``
  We sit permanently in this state if there is no
  ``REACT_APP_STUDY_API_BASE`` env.var.

``booting``
  We start in this state if ``REACT_APP_STUDY_API_BASE`` env.var is
  set.

``validating-saved-session``
  We are waiting for a response from the back-end server to a
  validation request for an existing session token from browser-local
  storage.

``no-valid-session``
  We have not entered the webapp via a *join* URL, and have no session
  token in browser-local storage.

``valid`` (with *participation-info*)
  We have successfully joined a study and have a valid session token.
  This can arise either by validating a stored session token, or by
  receiving a new one.

``failed``
  Something went wrong.

``signing-out``
  The user has clicked the *sign out* button; we are waiting for the
  back-end server to acknowledge our sign-out request.

``showing-post-survey-link`` (with *participation-code*)
  The session has been terminated at the server, and we are showing
  the "please take the post-participation survey" button.

``signed-out``
  The user has signed out and clicked on the "please take the
  post-participation survey" button.

``joining`` (with *study-code* and *number-of-failed-attempts*)
  We are attempting to join a study.  The study-code has been taken
  from the URL.  This status has 'phases' as follows:

  ``awaiting-user-input``
    We are waiting for the user to enter their participant code.

  ``requesting-session``
    We have submitted the study-code (from the URL) and participant-code
    (as typed in by the user) to the back-end server and are waiting for
    a response.

  ``showing-pre-survey-link`` (with *participation-info*)
    We have received a session token from the back-end server and are
    showing the user the "please take the survey" link, with their
    participation code embedded in the URL.

  ``awaiting-user-ok`` (with *participation-info*)
    The user has clicked on the "please take the survey" button, and we
    are waiting for them to click "OK" to proceed to the main site.

In ``joining``, we track how many failed attempts there have been to
be able to show appropriate instructions ("try again" message).


Joining a study
---------------

The user goes to a link of the form::

  pytch.org/app/join/01234567-abcd-0123-abcd-0123456789ab

where the last component is a study code.  For a non-release build of
the Pytch webapp, the link is of the form::

  pytch.org/beta/g000011112222/app/join/01234567-abcd-0123-abcd-0123456789ab

The study-enabled site might alternatively be hosted elsewhere.

The user types in their own personal participant code and submits it.  Assuming the codes are
valid, the back-end server issues a session token, and the front-end
presents a success message together with an invitation to take a
pre-participation survey.  The button launches the survey in a new
tab, and changes the text to invite the user to click an ``OK`` button
to proceed to the usual Pytch webapp.  The idea is that the user fills
in the survey and closes that tab, which returns them to the Pytch
site, although we have no way of knowing whether the user did in fact
take the survey.

The behaviour is driven in the top-level ``App`` component, which
returns just a ``StudySessionManager`` unless we've either
successfully joined a study (so in ``valid`` state) or the app has not
been built to allow joining a study (so in ``not-in-use`` state).


Leaving the study
-----------------

The user can sign out from the study.  The app sends a request to the
server to invalidate the session, and then presents the user with an
invitation to take a post-participation survey.  Clicking that button
launches the survey in a new tab.  The idea is that the user fills in
the survey and closes that tab, which returns them to the Pytch site
which by now is presenting a simple "thanks" message.


The ``StudySessionManager`` component
-------------------------------------

Returns an appropriate component depending on status.  Has an *Effect*
to launch the ``boot()`` thunk from ``booting`` state.  For most
statuses, just shows a static message or a spinner.  When joining a
study, uses a ``JoinStudyModal`` component:


The ``JoinStudyModal`` component
--------------------------------

Manages the phases (``awaiting-user-input``, ``requesting-session``,
``awaiting-user-ok``) of the joining process.  Has component-local
state for the code the user is typing in.  "Modal" in the sense that
the app won't proceed until the joining process has finished (either
successfully or in failure); it's not a separate modal dialog box.


Actions and thunks
------------------

Directs transitions between above states, calling to back-end server
as required.  See code in::

  src/model/study-session.ts

Also provides entry point for submitting events to back-end server;
see next.


Submitting events
-----------------

Achieved by the

   ``submitEvent()``

thunk.  To simplify the rest of the app, it is not an error to submit
an event when the whole study machinery is not enabled.  It is,
however, an error to submit an event if not in state ``valid``.
Although the ``submitEvent()`` thunk awaits the response from the
back-end server, callers typically do not await ``submitEvent()``,
because there's nothing they can do if there is a problem.

Each event has a ``kind`` and some ``detail``.  See example usages of
``submitEvent()`` when building code or navigating within a tutorial.

TODO: At least log something if there is an error?
