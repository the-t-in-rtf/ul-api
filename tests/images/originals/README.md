This directory contains test images stored using the conventions expected by the code in this package that reads
and writes image files, which is as follows:

`/:uid/:source/:image_id`

| Field      | Description |
| ---------- | ----------- |
| `uid`      | The unique identifier of a Unified Listing product record. |
| `source`   | The source of the image, generally either a named source (`~username`) or `unified`. |
| `image_id` | The unique ID for the file, which also serves as its filename, such as `12345.jpg`. |

This data should correspond to the metadata stored in %ul-api/tests/data/images.json.