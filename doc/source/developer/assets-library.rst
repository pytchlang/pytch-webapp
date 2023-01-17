Assets Library
==============

To enhance the user experience, we decided to provide a library of
clipart.  Indeed, thanks to this feature, the user can add images to
their project instead of looking for them online beforehand.


Where the clipart is stored
---------------------------

There is a separate repository ``pytch-medialib``.  In due course we
expect media to be collected and stored in this repository.  However,
for the initial release of this feature, we are collecting all assets
from tutorials.  This is done by utilities within the ``pytch-build``
repository.


How the clipart is structured
-----------------------------

Often, a group of assets belong together.  For examples, images for
each of the digits from zero to nine.  For a better user experience,
these are presented as one *entry* in the media library, with each
digit being an *item* within that entry.  In fact, the media library
exactly consists of a collection of such *entries*, even where a
particular entry contains only one item.

Each *entry* has a list of *tags*.  These allow the user to filter the
collection of media to just those of interest.  This initial release
gives tags to an entry based on the tutorial which provided that
entry.

How the clipart is provided
---------------------------

The individual assets are provided via standard http.  As well as
files for the assets themselves, there is an index file in json
format, describing the above structure.

The top-level object in the json is an array.  Each element of that
array is an object describing one *entry* in the media library.  The
objects are of this form:

.. code-block:: json

   {
     "id": 64019,
     "name": "apple.png",
     "tags": [
       "Tutorial \"Catch the apple\"",
       "Tutorial \"Shoot the fruit\""
     ],
     "items": [
       {
         "name": "apple.png",
         "relativeUrl": "224f⋯bb71c.png",
         "size": [65, 65]
       }
     ]
   },

This example *entry* has just one *item* in it.  The item's
``relativeUrl`` is a filename whose basename is the SHA256 hash of its
contents, and whose extension is the original file's extension.  This
allows for de-duplication.

The data regarding the media library is, during development, served
through a local server ``http://localhost:8127``.  This happens via
the script ``dev-server-medialib.sh`` within the ``pytch-build`` repo.

For a deployment build, the ``pytch-medialib`` subproject contributes
its own layer of the build image, in a similar fashion to other layers
such as the tutorials.  As noted above, this is handled by tools
within the ``pytch-build`` repo.


App model slices
----------------

The job of fetching the needed data is done by logic in the
``model/clipart-gallery.ts`` file.

Data relating to the user's interaction with the gallery, as part of
using the "add clip art" modal, is handled by logic in the
``model/user-interactions/clipart-gallery-select.ts`` file.


Notes for future exploration
----------------------------

Some less structured notes and thoughts follow.

Multiple galleries
~~~~~~~~~~~~~~~~~~

Do we want to support multiple galleries?  Or "collections"?  Does the
structure need to be hierarchical?

Thumbnails?  A 120×120 PNG is about 15k for some typical images, so
base64 encodes to about 19k.  Scratch's "choose a sprite" page has c.340
sprites, each of which does actually seem to cause an HTTP GET.  And
then further GETs for sprites with multiple costumes, animated on hover,
with no cache?  Wireshark seems to confirm actual traffic.  Odd, since
items are identified by MD5 and so can be treated as immutable.  A lot
of Scratch sprites are SVG which are smaller; some are PNGs of photos,
with the puppy one having sizes of say 30k each.

Some backdrop images are larger.  E.g., green field for splat-mole is
86k; resized to 120x90 is 6.4k.  Might be worth doing this.

Alternatives include serving a zipfile (and creating ObjectURLs);
serving an atlas / sprite-sheet (maybe splitting PNGs and JPGs into
their own sheets) and selecting just the relevant rectangle for each
asset display-card.  The real asset then loaded if the user chooses that
one.

For *Structured Pytch* tutorials, will want to constrain the clipart
popup to just the assets for that particular tutorial.  Add a
*gallery-filter* to the app state?  For now that can be just a list of
strings which give the galleries to include.  Loading a tutorial can set
that as appropriate; loading a user's project can set some magic "all"
value.

Identifying particular media
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We include a deployment-id in the path, like we do for tutorials.

Multiple related media
~~~~~~~~~~~~~~~~~~~~~~

Nice in Scratch that you can add a Sprite, which then has multiple
costumes already part of it.  Mostly handled by concept of *entries*,
but can revisit based on feedback.

Licensing information
~~~~~~~~~~~~~~~~~~~~~

The ``pytch-build`` tools emit a documentation file giving licence and
copyright information for all assets.  This satisfies our obligations
under, for example, the "Attribution" Creative Commons licences,
although something more targeted per image might be cleaner in future.

Assets used in tutorials
~~~~~~~~~~~~~~~~~~~~~~~~

It might eventually make sense to invert the relationship between the
media library and the tutorials.  All media lives in the
media-library, and tutorials have a mechanism for saying "use *this
asset* from the media library".
