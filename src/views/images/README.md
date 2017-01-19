This directory contains the view documents used by the UL Image API, which must be present for the gallery, metadata,
and other endpoints to function properly.

# Installing the Views

If you do not already have these views installed, you can simply upload them using a utility like `curl` and a command
like the following:

`for file in *.json; do curl -X POST -H "Content-Type: application/json" -d @$file http://username:password@hostname:port/db/_bulk_docs; done`

# Updating the Views

If you are updating to use a newer version of this library, it is recommended that you refresh the views. As the
number of views is likely to change over time, it is recommended that you use [Futon](https://wiki.apache.org/couchdb/Getting_started_with_Futon)
or the equivalent REST calls to remove the existing design documents from the database that stores UL images.  You
should then follow the instructions in "Installing the Views" above.