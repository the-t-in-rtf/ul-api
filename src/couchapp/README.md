The contents of this directory are meant to be pushed to a couchdb instance and hosted from there.

All code follows the "couchapp" conventions based on our previous use of [that tool](https://github.com/couchapp/couchapp).

As this tool is poorly maintained, there are two convenience scripts, the first to generate design documents, as in:

```shell script
node src/js/lib/couchapp-to-views.js
```

This will save the latest design documents to `tests/data/views.json`.  There is a second script that will update
a CouchDB instance with the views, as in:

```shell script
node src/js/lib/sync-views.js
```

This is only configured to manage the four views currently used, and expects to communicate with a CouchDB instance
listening on port 5984 with the hardcoded username and password in the script.
