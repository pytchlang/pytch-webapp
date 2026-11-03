# Captured v7 data

`captured-v7-data.json` holds the `projectSummaries` and
`projectPytchPrograms` tables of a "pytch" IndexedDB database at
version 7, as created by the app itself.  It is used by
`cypress/e2e/db-upgrade.cy.ts` to test the upgrade to version 8.

The asset tables were not captured: they hold binary data, and the
test does not need them.

## How it was created

1. In Chrome, using a build of the app from before the DBv8 upgrade
   (i.e., where `DexieStorage` declares versions only up to
   `version(7)`), delete any existing database: DevTools → Application
   → Storage → IndexedDB → `pytch` → "Delete database".  Deleting the
   projects within the app is not enough: if the database is already
   at version 8, Dexie opens it at that version without error.

2. Reload the app, which creates a fresh version-7 database, and create
   these projects:

   * a project following the "flat" tutorial `catch-apple`, moved on to
     chapter 3;
   * a project following the "per-method" tutorial
     `script-by-script-shoot-the-fruit`, moved on to chapter 1;
   * an empty "per-method" project, named `Empty per-method project`.

3. In the DevTools console, run:

   ```js
   (() => {
     const req = indexedDB.open("pytch");
     req.onsuccess = async () => {
       const db = req.result;
       const getAll = (name) =>
         new Promise((resolve, reject) => {
           const r = db.transaction(name).objectStore(name).getAll();
           r.onsuccess = () => resolve(r.result);
           r.onerror = () => reject(r.error);
         });
       window.pytchDump = {
         nativeVersion: db.version,
         projectSummaries: await getAll("projectSummaries"),
         projectPytchPrograms: await getAll("projectPytchPrograms"),
       };
       db.close();
       console.log("captured", window.pytchDump);
     };
   })();
   ```

   then copy the result to the clipboard with:

   ```js
   copy(JSON.stringify(window.pytchDump, null, 2))
   ```

4. Check that `nativeVersion` is `70` (Dexie's version 7, times 10).  If
   it is `80`, the database had already been upgraded; start again from
   step 1.  The test also checks this.

5. Paste the clipboard contents into `captured-v7-data.json`.

The test relies on the details of these projects (names, chapter
indexes, ids), so if the data is re-captured, check the expectations in
`db-upgrade.cy.ts` still match.
