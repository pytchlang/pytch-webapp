Assets Library
==============
To enhance the user experience, we decided to provide a library of cliparts. Indeed, thanks to this feature, the user can add images to their project instead of looking for them online beforehand. 

Where the cliparts are stored
-----------------------------
All the data regarding the cliparts can be found in the ``pytch-assets-library`` repository. The image files of the cliparts (preferably in png format) are stored in the ``images/`` folder.
The ``clipart_assets_list.json`` contains a list of JSON objects. Each of those objects corresponds to a particular clipart, and contains three informations :
See the example below:

.. code-block:: shell

   { "id": 1001, "name": "alien", "data": "images/alien.png" }
    
App model slice for fetching external data
------------------------------------------
The job of fetching the needed data is done by in the ``model/clipart-gallery.ts`` file.
It contains the types describing individual cliparts (``ClipArtGalleryItem``) and the gallery as a whole (``ClipartGalleryState``).

The data regarding the cliparts is served through a local server ``http://localhost:8127``, allowing us to then have access to each cliparts by url (for example: ``http://localhost:8127/images/alien.pn``)




