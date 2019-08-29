# Unified Listing API

The Unified Listing is a federated database of products, including those focused on Assistive Technology users as well as mainstream products

This API allows developers to read, create, and update products stored in the Unified Listing.

This document describes the REST API, including the syntax required to use all commands, and the format of all data to be passed into and returned from the API.

# Data Objects

This section describes the data objects which are accepted by and returned by the Unified Listing API.

## Product Records

A product is a distinct piece of software or equipment.  All products in the Unified Listing have the following common 
fields:

|Field                      | Description |
| ------------------------- | ----------- |
| `description` (required)  | A description of the product.|
| `manufacturer` (required) | A JSON object describing the manufacturer (see ["Manufacturer"](#manufacturers) below).|
| `name` (required)         | The name of the product.|
| `sid` (required)          | The unique identifier to identify this record in the source database.|
| `source` (required)       | The source of this record.  If the record is provided by a source database, this field will be set to a unique string identifying the source.  If this record is unique to the Unified Listing, this field will be set to "unified".|
| `status` (required)       | The status of this record.  Current supported values are listed below under ["status"](#statuses).|
| `uid` (required)          | The Universal ID ("uid") is the ID of the "unified" record for a given product.  "Source" products use this field to indicate which "unified" record they are associated with (if any). |
| `updated` (required)      | The date at which the record was last updated.|
| `language`                | The language used in the text of this record, expressed using a two letter language, code, an underscore, and a two letter country code, as in `en_us` or `it_it`.  If this is not specified, `en_us` is assumed.|

## Source Records

The Unified Listing contains source products pulled from sources such as [EASTIN](http://www.eastin.eu/) and [GARI](http://www.gari.info/), represented as JSON objects.

In addition to the fields described in ["Product records"](#product-records), a source record includes the following additional fields:

| Field        | Description |
| ------------ | ----------- |
| `sourceData` | The original source record represented as a JSON object.  As a source database may have any fields they like, so there are no other restrictions on this field.|
| `sourceURL`  | An optional URL where the original version of this record in the source site can be found.|

Here is an example JSON representation of a source record with all fields:

    {
        "source": "siva",
        "sid": "19449",
        "name": "ANS - SET PUNTATORI ANS",
        "description": "",
        "manufacturer": {
            "name": "ASSOCIAZIONE NAZIONALE SUBVEDENTI",
            "address": "Via Clericetti, 22",
            "postalCode": "20133",
            "cityTown": "Milano",
            "country": "ITALY",
            "phone": "+39-0270632850",
            "email": "info@subvedenti.it",
            "url": "http://www.subvedenti.it/"
        },
        "status": "discontinued",
        "language: "it_it",
        "sourceURL": "http://portale.siva.it/it-IT/databases/products/detail/id-19449",
        "sourceData": {
            "ManufacturerAddress": "Via Clericetti, 22",
            "ManufacturerPostalCode": "20133",
            "ManufacturerTown": "Milano",
            "ManufacturerCountry": "ITALY",
            "ManufacturerPhone": "+39-0270632850",
            "ManufacturerEmail": "info@subvedenti.it",
            "ManufacturerWebSiteUrl": "http://www.subvedenti.it/",
            "ImageUrl": "http://portale.siva.it/files/images/product/full/19449_b.jpg",
            "EnglishDescription": "",
            "OriginalUrl": "http://portale.siva.it/it-IT/databases/products/detail/id-19449",
            "EnglishUrl": "http://portale.siva.it/en-GB/databases/products/detail/id-19449",
            "Features": [
              {
                "FeatureId": 295,
                "FeatureName": "Italian",
                "FeatureParentName": "Languages",
                "ValueMin": 0,
                "ValueMax": 0
              },
              {
                "FeatureId": 316,
                "FeatureName": "Windows",
                "FeatureParentName": "Operating systems",
                "ValueMin": 0,
                "ValueMax": 0
              },
              {
                "FeatureId": 161,
                "FeatureName": "Free of charge",
                "FeatureParentName": "Software price policy",
                "ValueMin": 0,
                "ValueMax": 0
              },
              {
                "FeatureId": 281,
                "FeatureName": "Software to modify the pointer appearance",
                "FeatureParentName": "Subdivision",
                "ValueMin": 0,
                "ValueMax": 0
              }
            ],
            "Database": "Siva",
            "ProductCode": "19449",
            "IsoCodePrimary": {
              "Code": "22.39.12",
              "Name": "Special output software"
            },
            "IsoCodesOptional": [],
            "CommercialName": "ANS - SET PUNTATORI ANS",
            "ManufacturerOriginalFullName": "ASSOCIAZIONE NAZIONALE SUBVEDENTI",
            "InsertDate": "2012-10-02T15:21:00+02:00",
            "LastUpdateDate": "2012-10-02T15:24:00+02:00",
            "ThumbnailImageUrl": "http://portale.siva.it/files/images/product/thumbs/19449_s.jpg",
            "SimilarityLevel": 0
            }
        },
        "updated": "2012-10-02T15:24:00+02:00"
    }

## Unified Listing Records

The Unified Listing also contains "unified" records, which are a summary in US English of one or more source products.  
When adding or editing a record, all of the fields mentioned in ["Product records"](#product-records) are supported.

When viewing a record returned by the API, you may also see the following additional fields.

| Field     | Description |
| --------- | ----------- |
| `sources` | An array containing a list of "source" products (see ["Source Records"](#source-records) above). |

This field is not editable, and will be rejected if you pass it as part of a new record or an update.  In most endpoints,
you can retrieve records without this field by setting the `unified` option to `false`.

Here is an example of a full "unified" record in JSON format, as might be returned by the search:

    {
        "source": "unified",
        "uid": "com.maker.win7.sample",
        "sid": "com.maker.win7.sample",
        "name": "A Sample Unified Listing Record",
        "description": "A record that combines 2-3 additional products' worth of information."
        "manufacturer": {
            "name": "Maker Software",
            "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
            "postalCode": "27707",
            "cityTown": "Durham",
            "provinceRegion": "North Carolina",
            "country": "United States",
            "phone": "(704) 555-1212",
            "email": "maker@maker.com",
            "url": "http://www.maker.com/"
        },
        "status": "active",
        "language: "en_us",
        "sources": [ "siva:2345" ],
        "updated": "2014-11-30T22:04:15Z"
    }

## Statuses

The Unified Listing has a simple workflow to manage the lifecycle of all products.  The status field indicates which step in the workflow the product is currently at.

The following table describes the allowed statutes and when they are to be used.

| Status         | Description |
| -------------- | ----------- |
| `new`          | A product that has just been added and which has not been reviewed.|
| `active`       | A product that has been reviewed and which is currently available.|
| `discontinued` | A product which is no longer being produced (but which may still be available on the used market).|
| `deleted`      | A product record which was has been deleted for administrative reasons.  Should only be used for duplicates or mistakenly-created products.  For products that are no longer available, use "discontinued" instead.|

## Manufacturers

The company or individual that produces a product is called a "manufacturer" in the Unified Listing.  The following table describes the available fields and how they are to be used.

| Field             | Description |
| ----------------- | ----------- |
| `name` (required) | The name of the manufacturer. |
| `address`         | The street address of the manufacturer (may also be used for the complete address). |
| `postalCode`      | The postal code (ZIP code, etc.) of the manufacturer. |
| `cityTown`        | The city/town in which the manufacturer is located. |
| `provinceRegion`  | The province/region in which the manufacturer is located. |
| `country`         | The country in which the manufacturer is located. |
| `phone`           | The phone number of the manufacturer. |
| `email`           | An email address at which the manufacturer can be contacted. |
| `url`             | The manufacturer's web site. |

 A JSON representation of a manufacturer with all fields looks as follows:

    "manufacturer": {
        "name": "Maker Software",
        "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
        "postalCode": "27707",
        "cityTown": "Durham",
        "provinceRegion": "North Carolina",
        "country": "United States",
        "phone": "(704) 555-1212",
        "email": "maker@maker.com",
        "url": "http://www.maker.com/"
    }

# Encoding of Query Variables

All query string variables must be [percent encoded](https://tools.ietf.org/html/rfc3986#section-2.1) stringified JSON.
As an example, if you wish to set the query variable `q` to ``myString`, the query string should look something like:

`?q=%22myString%22`

If you wish to set the query variable `status` to only display `new` and `deleted` records, the query string should look
something like:

`?status=%5B%22deleted%22,%22new%22%5D`


# API REST endpoints


## Core API

### `POST /api/product`

Creates a new product record.  Regardless of the information provided, all products default to the "new" status until
they are reviewed and flagged as "active".  You must be logged in to use this REST endpoint.

+ Request (application/json}

    ```
    {
        "source": "mydb",
        "sid": "1234",
        "name": "My Product",
        "description": "My Description",
        "manufacturer": {
            "name": "Me, Inc."
        },
        "sourceData": {
            "price": "free"
        },
        "updated": "2012-10-02T15:24:00+02:00"
    }
    ```
+ Response 200 (application/json)
    + Headers
        + Content-Type: application/json
    + Body

        ```
        {
            "message":"New product submitted.",
            "record": {
                "source": "mydb",
                "sid": "1234",
                "name": "My Product",
                "description": "My Description",
                "manufacturer": {
                    "name": "Me, Inc."
                },
                "status": "new",
                "sourceData": {
                    "price": "free"
                },
                "updated": "2012-10-02T15:24:00+02:00"
            }
        }
        ```

### `PUT /api/product`

Update an existing product.  You must provide a complete record in JSON format.  Returns the updated product record.
You must be logged in to use this REST endpoint.

Note: If you do not submit an "updated" field, the current date will be used.

+ Request (application/json)

    ```
    {
        "source": "mydb",
        "sid": "1234",
        "name": "My Product",
        "description": "This existing record needs to be updated.",
        "manufacturer": {
            "name": "Me, Inc."
        },
        "status": "new",
        "sourceData": {
            "price": "$20.00"
        }
     }
    ```

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/json
    + Body

        ```
        {
            "message":"Product record updated.",
            "record": {
                "source": "mydb",
                "sid": "1234",
                "name": "My Product",
                "description": "This existing record needs to be updated.",
                "manufacturer": {
                    "name": "Me, Inc."
                },
                "status": "new",
                "sourceData": {
                    "price": "$20.00"
                },
                "updated": "2014-12-02T15:24:00+02:00"
            }
        }
        ```

### `DELETE /api/product/{source}/{sid}`

Flags the record with `source` and `sid` as deleted.  If an author is supplied, gives them credit, otherwise the
current user is listed as the author.  You must be logged in to use this REST endpoint.

+ Parameters
    + `uid` (required, string) ... The universal identifier of a single record.

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/json
    + Body

        ```
        {
            "message": "Record flagged as deleted."
        }
        ```

### `GET /api/product/{source}/{sid}{?includeSources}`

Returns a single product identified by its `source` and `sid`.  For ["unified" records](#unified-records), source products are included by default.

+ Parameters
    + `includeSources` (optional, boolean) ... If this is a "unified" record, display the source records associated with this record.  Defaults to "false".

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/json
    + Body

        ```
        {
            "source": "unified",
            "uid": "com.maker.win7.sample",
            "sid": "com.maker.win7.sample",
            "name": "A Sample Unified Listing Record",
            "description": "A record that combines 2-3 additional products' worth of information."
            "manufacturer": {
                "name": "Maker Software",
                "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
                "postalCode": "27707",
                "cityTown": "Durham",
                "provinceRegion": "North Carolina",
                "country": "United States",
                "phone": "(704) 555-1212",
                "email": "maker@maker.com",
                "url": "http://www.maker.com/"
            },
            "status": "active",
            "language: "en_us",
            "updated": "2014-11-30T22:04:15Z"
        }
        ```


### `GET /api/products{?sources,status,updatedSince,offset,limit,unified,sortBy}`

Return a list of products, with optional filters (see below).

+ Parameters
    + `sources` (optional, string) ... Only display products from a particular source.  If this is omitted, records from all visible sources are displayed. For a single value, you can supply a string. For multiple values, you must supply an array
    + `status` (optional, string) ... The product status(es) to return (defaults to everything but 'deleted' products).  For a single value, you can supply a string. For multiple values, you must supply an array.
    + `updatedSince` (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only products updated at or after this time are returned.
    + `offset` (optional, string) ... The number of products to skip in the list of results.  Used for pagination.
    + `limit` (optional, string) ... The number of products to return.  Used for pagination.
    + `unified` (optional, boolean) ... If this is set to true, combine all products according to their "unified" grouping.  Defaults to `true`.  If this is set to `true` and `sources` is set, the `unified` source is automatically added to the list of `sources` (see above).
    + `sortBy` (optional,string) ... The sort order to use when displaying products.  Conforms to [lucene's query syntax][1].

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/json
    + Body

        ```
        {
            "total_rows": 1,
            "params": {
                "offset": 0,
                "limit": 1
            },
            "products": [
                {
                    "source": "unified",
                    "uid": "com.maker.win7.sample",
                    "sid": "com.maker.win7.sample",
                    "name": "A Sample Unified Listing Record",
                    "description": "A record that combines 2-3 additional products' worth of information."
                    "manufacturer": {
                        "name": "Maker Software",
                        "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
                        "postalCode": "27707",
                        "cityTown": "Durham",
                        "provinceRegion": "North Carolina",
                        "country": "United States",
                        "phone": "(704) 555-1212",
                        "email": "maker@maker.com",
                        "url": "http://www.maker.com/"
                    },
                    "status": "active",
                    "language: "en_us",
                    "sources": [ "siva:2345" ],
                    "updated": "2014-11-30T22:04:15Z"
                }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

Although the default behavior is to display all records grouped by the associated "unified" record, this endpoint can
also be used to list the records from one or more sources, for example, to display contributions from the user `sample1`,
you might use a URL like `/api/products?sources=%22sample1%22&unified=false`.


### `GET /api/search{?q,status,offset,limit,sortBy}`

Performs a full text search of all data, returns matching products, grouped by the "unified" record they are associated with.

 + Parameters
    + `q` (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax](http://lucene.apache.org/core/3_6_2/queryparsersyntax.html) to construct more complex searches.
    + `status` (optional, string) ... The product status(es) to return (defaults to everything but 'deleted' products).  For a single value, you can supply a string. For multiple values, you must supply an array.
    + `offset` (optional, string) ... The number of products to skip in the list of results.  Used for pagination.
    + `limit` (optional, string) ... The number of products to return.  Used for pagination.  A maximum of 100 search results are returned, anything higher is silently ignored.
    + `sortBy` (optional,string) ... The sort order to use when displaying products.  Conforms to [lucene's query syntax][1].

 + Response 200 (application/json)
     + Headers
         + Content-Type: application/json
     + Body

         ```
         {
             "total_rows": 1,
             "params": {
                  "q": "jaws",
                  "offset": 0,
                  "limit": 100,
                  "sortBy": "uid ASC",
                  "status": [ "active" ]
             },
             "products": [
                {
                    "source": "unified",
                    "uid": "com.maker.win7.sample",
                    "sid": "com.maker.win7.sample",
                    "name": "A Sample Unified Listing Record",
                    "description": "A record that combines 2-3 additional products' worth of information."
                    "manufacturer": {
                        "name": "Maker Software",
                        "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
                        "postalCode": "27707",
                        "cityTown": "Durham",
                        "provinceRegion": "North Carolina",
                        "country": "United States",
                        "phone": "(704) 555-1212",
                        "email": "maker@maker.com",
                        "url": "http://www.maker.com/"
                    },
                    "status": "active",
                    "language: "en_us",
                    "sources": [ "siva:2345" ],
                    "updated": "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

 ### GET /api/suggest/{?q,status,sortBy}

Suggest a short list of products that match the search terms.  Performs a search as in /api/search, but only returns 5
results and does not support paging.  Equivalent to `/api/search?q=<SEARCH>&results=5&unified=false`.  This is intended
for use in things like "autocomplete", where a fuller list would be too cumbersome.

 + Parameters
     + `q` (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax][1] to construct more complex searches.
     + `status` (optional, string) ... The product status(es) to return (defaults to everything but 'deleted' products).  For a single value, you can supply a string. For multiple values, you must supply an array.
     + `sortBy` (optional,string) ... The sort order to use when displaying products.  Conforms to [lucene's query syntax][1].

 + Response 200 (application/json)
     + Headers
         + Content-Type: application/json
     + Body

         ```
         {
             "total_rows": 1,
             "params": {
                  "q": "jaws",
                  "status": [ "active" ]
             },
             "products": [
                {
                    "source": "unified",
                    "uid": "com.maker.win7.sample",
                    "sid": "com.maker.win7.sample",
                    "name": "A Sample Unified Listing Record",
                    "description": "A record that combines 2-3 additional products' worth of information."
                    "manufacturer": {
                        "name": "Maker Software",
                        "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
                        "postalCode": "27707",
                        "cityTown": "Durham",
                        "provinceRegion": "North Carolina",
                        "country": "United States",
                        "phone": "(704) 555-1212",
                        "email": "maker@maker.com",
                        "url": "http://www.maker.com/"
                    },
                    "status": "active",
                    "language: "en_us",
                    "sources": [ "siva:2345" ],
                    "updated": "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

 ### `GET /api/updates/{?sources,updatedSince,sourcesNewer}`

Compare "unified" records to one or more "sources" and highlight "updates", which by default are cases in which the
"unified" record has been updated more recently than the "source" record.

 + Parameters
     + `sources` (required, String|Array) ... Only display products from the specified sources.
     + `updatedSince` (optional, String) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only unified product records updated at or after this time are included in the comparison.
     + `sourcesNewer` (optional, Boolean) ... If `true`, the comparison is inverted, and cases in which the "source" record is newer will be displayed.  Defaults to `false`.

 + Response 200 (application/json)
     + Headers
         + Content-Type: application/json
     + Body

         ```
         {
             "total_rows": 1,
             "params": {
                  "sources": ["Vlibank"]
                  "updatedSince": "2014-05-25T11:23:32.441Z"
             },
             "products": [
                {
                    "source": "unified",
                    "uid": "com.maker.win7.sample",
                    "sid": "com.maker.win7.sample",
                    "name": "A Sample Unified Listing Record",
                    "description": "A record that combines 2-3 additional products' worth of information."
                    "manufacturer": {
                        "name": "Maker Software",
                        "address": "4806 Hope Valley Road\nDurham, NC, 27707\nUnited States",
                        "postalCode": "27707",
                        "cityTown": "Durham",
                        "provinceRegion": "North Carolina",
                        "country": "United States",
                        "phone": "(704) 555-1212",
                        "email": "maker@maker.com",
                        "url": "http://www.maker.com/"
                    },
                    "status": "active",
                    "language: "en_us",
                    "sources": [ "siva:2345" ],
                    "updated": "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

## Merge API

### `POST /api/merge?{target,sources}`

Merge one or more duplicated "unified" records with an "original" record.  This will:

1. Associate all source records previously associated with a "duplicate" with the "original" record instead.
2. Update each "duplicate" record's `uid` value to point to the "original" record.
3. Flag each "duplicate" as deleted.

All changes will be performed as a single update.  A merge cannot be undone in a single step.  To manually unmerge a
record:

1. Change the status of the merged record to "new" or another non-deleted status.
2. Change the merged record's `uid` to match its own `sid` value.
3. Update each source record that should be associated with the merged record to use the merged record's `sid` as its `uid` value.

 + Parameters
     + `target` (required, String) ... The unique identifier (uid) for the "original" unified record.
     + `sources` (required, String|Array) ... One or more unique identifiers (uids) for records which are duplicates of the "original" referred to by `target`.

 + Response 200 (application/json)
     + Headers
         + Content-Type: application/json
     + Body

         ```
         {
            message: "Records merged successfully."
         }
         ```

## User Management

Some of the functions described here require you to have an account and be logged in.  The REST endpoints required to
create an account, log in, etc. are described [in the user management API documentation](https://github.com/GPII/gpii-express-user/).

## Image API

The image management API endpoints are described [in the image API documentation](image-apidocs.md).



