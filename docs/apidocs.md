# Unified Listing API

The Unified Listing is a federated database of products, including those focused on Assistive Technology users as well as mainstream products

This API allows developers to read, create, and update products stored in the Unified Listing.

This document describes the REST API, including the syntax required to use all commands, and the format of all data to be passed into and returned from the API.

# Data Objects
This section describes the data objects which are accepted by and returned by the Unified Listing API.

## Product Records

A product is a distinct piece of software or equipment.  Products may have more than one version or edition, which may provide different features.  For more information about editions (versions or models of a product), see the ["Editions"](#editions) section.

All products in the Unified Listing have the following common fields:

|Field                      | Description |
| ------------------------- | ----------- |
| `description` (required)  | A description of the product.|
| `manufacturer` (required) | A JSON object describing the manufacturer (see ["Manufacturer"](#manufacturers) below).|
| `name` (required)         | The name of the product.|
| `sid` (required)          | The unique identifier to identify this record in the source database.|
| `source` (required)       | The source of this record.  If the record is provided by a source database, this field will be set to a unique string identifying the source.  If this record is unique to the Unified Listing, this field will be set to "ul".|
| `status` (required)       | The status of this record.  Current supported values are listed below under ["Statuses"](#statuses).|
| `uid` (required)          | The Universal ID ("uid") is an id that is unique in the Unified listing and which is constant for different editions of a product (see ["editions"](#editions)).  "Source" products use this field to indicate which "unified" record they are associated with (if any).|
| `updated` (required)      | The date at which the record was last updated.|
| `images`                  | Images of the product, if available (see ["Images"](#images) below).|
| `language`                | The language used in the text of this record, expressed using a two letter language, code, an underscore, and a two letter country code, as in `en_us` or `it_it`.  If this is not specified, `en_us` is assumed.|

## Source Records

The Unified Listing contains source products pulled from sources such as [EASTIN](http://www.eastin.eu/) and [GARI](http://www.gari.info/), represented as JSON objects.

In addition to the fields described in ["Product records"](#product-records), a source record includes the following additional fields:

| Field                   | Description |
| ----------------------- | ----------- |
| `sourceData` (required) | The original source record represented as a JSON object.  As a source database may have any fields they like, so there are no other restrictions on this field.|


A JSON representation of a source record with all fields looks as follows:

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

The Unified Listing also contains "unified" records, which are a summary in US English of one or more source products.  In addition to the fields mentioned in ["Product records"](#product-records), a "unified" record supports the following additional fields:

| Field                 | Description |
| --------------------- | ----------- |
| `sources` (required)  | An array containing a list of "source" products (see ["Source Records"](#source-records) above). |
| `editions` (required) | A hash containing one or more "editions" of the product (see ["Editions"](#editions) below).  At least one edition named "default" is required. |

A full "unified" record in JSON format looks something like:

    {
        "source": "ul",
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
        "editions": {
            "default": {
                "contexts": { "OS": { "id": "android", "version": ">=0.1" } },
                "settingsHandlers": [],
                "lifeCycleManager": {}
            }
        },
        "ontologies": {
            "iso9999": {
                "primaryCode": "22.39.12",
                "secondaryCodes": [ "22.39.07" ]
            }
        },
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

## Images

Many of the databases we federate include pictures with a product listing.  If available, we store this information in the `images` field of a source record.  This field is an array, there can be multiple images for a single product.  We need two pieces of information about each image. First, we need a URL where the image can be found.  Second, we need text we can use to describe the image for screen readers.  Each entry looks roughly like:

    {
      "url": "http://www.vlibank.be/scan.jsp?PID=A10149&TYPE=jpg&RANG=A&SIZE=medium",
      "description": "Mini Joystick with Push - / USB"
    }

## Ontologies

There are many ways of classifying products and product features.  In the Unified Listing, we provide support for multiple ontologies without proscribing a set format.  The only thing that is required is that the ontology itself have a key which is unique within the given record.

Here is an example of the ontologies section of a product represented in JSON format (based on the data we have from EASTIN):

    "ontologies": {
        "iso9999": {
            "primaryCode": "22.39.12",
            "secondaryCodes": [ "22.39.07" ]
        }
    }

## Editions

A software product may have various versions or editions that operate on different platforms.  A physical device may have multiple editions that provide different features.

Each variation on the product that has different features is an "edition" of the product.  Variations that are only cosmetically different (such as different colors) should not need to have more than one edition.

An edition is required to have a unique key.  There must be at least one edition, called "default" which is used when the version or variation is otherwise unknown.

The simplest set of editions represented in JSON format looks something like the following:

    editions: {
        "default": {
            "contexts": {
                "OS": [{
                        "id": "android",
                        "version": ">=0.1"
                    }]
            },
            "settingsHandlers": [
                {
                    "type": "gpii.settingsHandlers.noSettings",
                    "capabilities": [
                        "display.screenReader",
                        "applications.com\\.android\\.freespeech.id",
                        "display.screenReader.applications.com\\.android\\.freespeech.name"
                    ]
                }
            ],
            "lifecycleManager": {
                "start": [
                    {
                        "type": "gpii.androidActivityManager.startFreespeech"
                    }
                ],
                "stop": [
                    {
                    }
                ]
            }
        }
    }

# API REST endpoints

## `/api/user`

Some of the functions described here require you to have an account and be logged in.  The REST endpoints required to
create an account, log in, etc. are described [in the user management API documentation](/api/user/).

## `POST /api/product`

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
+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/message+json; profile=https://registry.gpii.net/schema/record.json#
        + Link: <https://registry.gpii.net/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "message":"New product submitted."
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

## `PUT /api/product`

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

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/message.json#
        + Link: <https://registry.gpii.net/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "message":"Product record updated."
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

## `DELETE /api/product/{source}/{sid}`

Flags the record with `source` and `sid` as deleted.  If an author is supplied, gives them credit, otherwise the
current user is listed as the author.  You must be logged in to use this REST endpoint.

+ Parameters
    + `uid` (required, string) ... The universal identifier of a single record.

+ Response 200 (application/json)
    + Headers
        + Content-Type: application/message+json; profile=https://registry.gpii.net/schema/message.json#
        + Link: <https://registry.gpii.net/schema/message.json#>; rel="describedBy"
    + Body

        ```
        {
            "message": "Record flagged as deleted."
        }
        ```

## `GET /api/product/{source}/{sid}{?versions,sources}`

Returns a single product identified by its `source` and `sid`.  Only the latest published version is displayed by
default.  For ["unified" records](#unified-records), full source products are not included by default.

+ Parameters
    + `includeSources` (optional, boolean) ... If this is a "unified" record, you have the option to retrieve and display the source data rather than simply displaying a list of source IDs.  Defaults to "false".

+ Response 200 (application/record+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/record.json#
        + Link: <https://registry.gpii.net/schema/record.json#>; rel="describedBy"
    + Body

        ```
        {
            "record:
            {
                {
                    "source": "ul",
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
                    "editions": {
                        "default": {
                            "contexts": { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    },
                    "ontologies": {
                        "iso9999": {
                            "primaryCode": "22.39.12",
                            "secondaryCodes": [ "22.39.07" ]
                        }
                    },
                    "updated": "2014-11-30T22:04:15Z"
                }
            }
        }
        ```


## `GET /api/products{?source,status,updated,offset,limit,sources}`

Return the list of products, optionally filtered by source, status, or date of last update.

+ Parameters
    + `source` (optional, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.
    + `status` (optional, string) ... The product statuses to return (defaults to everything but 'deleted' products).  Can be repeated to include multiple statuses.
    + `updated` (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only products updated at or after this time are returned.
    + `offset` (optional, string) ... The number of products to skip in the list of results.  Used for pagination.
    + `limit` (optional, string) ... The number of products to return.  Used for pagination.
    + `sources` (optional, boolean) ... If this is set to true, combine all products according to their "unified" grouping.  If ``source`` values are specified, only unified products associated with products from the given source(s) will be included in the resutls.  Defaults to "false".

+ Response 200 (application/headers+json)
    + Headers
        + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/products.json#
        + Link: <https://registry.gpii.net/schema/products.json#>; rel="describedBy"
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
                    "source": "ul",
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
                    "editions": {
                        "default": {
                            "contexts": { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated": "2014-11-30T22:04:15Z"
                }
            ],
            "retrievedAt": "2014-05-25T11:23:32.441Z"
        }
        ```

## `GET /api/search{?q,sources,statuses,sortBy,offset,limit,unified}`

Performs a full text search of all data, returns matching products.

 + Parameters
    + `q` (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax](http://lucene.apache.org/core/3_6_2/queryparsersyntax.html) to construct more complex searches.
    + `sortBy` (optional,string) ... The sort order to use when displaying products.  Conforms to [lucene's query syntax][1].
    + `sources` (optional, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.  A record can be excluded by prepending an exclamation point in front of its name, as in ```source=!ul```.     + statuses (optional, string) ... The record statuses to return (defaults to everything but 'deleted' products).  Can be repeated to include multiple statuses.
    + `offset` (optional, string) ... The number of products to skip in the list of results.  Used for pagination.
    + `limit` (optional, string) ... The number of products to return.  Used for pagination.  A maximum of 100 search results are returned, anything higher is silently ignored.
    + `unified` (optional, boolean) ... If this is set to true, combine all search results according to their "unified" grouping.  Defaults to "true".

 + Response 200 (application/search+json)
     + Headers
         + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/search.json#
         + Link: <https://registry.gpii.net/schema/search.json#>; rel="describedBy"
     + Body

         ```
         {
             "total_rows": 1,
             "params": {
                  "q": "jaws",
                  "offset": 0,
                  "limit": 100,
                  "sort": "uid ASC",
                  "updatedSince": "2014-05-25T11:23:32.441Z",
                  "statuses": [ "active" ]
             },
             "products": [
                {
                    "source": "ul",
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
                    "editions": {
                        "default": {
                            "contexts": { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated": "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

 ## GET /api/suggest/{?q,source,status,sort}

Suggest a short list of products that match the search terms.  Performs a search as in /api/search, but only returns 5
results and does not support paging.  Equivalent to `/api/search?q=search&results=5&unified=false`.  Used to suggest related products
when building a "unified" record.

 + Parameters
     + `q` (required, string) ... The query string to match.  Can either consist of a word or phrase as plain text, or can use [lucene's query syntax][1] to construct more complex searches.
     + `sortBy` (optional,string) ... The sort order to use when displaying products.  Conforms to [lucene's query syntax][1].
     + `sources` (optional, string) ... Only display products from a particular source.  Can be repeated to return products from multiple sources.  A record can be excluded by prepending an exclamation point in front of its name, as in ```source=!ul```.
     + `statuses` (optional, string) ... The record statuses to return (defaults to everything but 'deleted' products).  Can be repeated to include multiple statuses.

 + Response 200 (application/search+json)
     + Headers
         + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/search.json#
         + Link: <https://registry.gpii.net/schema/search.json#>; rel="describedBy"
     + Body

         ```
         {
             "total_rows": 1,
             "params": {
                  "q": "jaws",
                  "updatedSince": "2014-05-25T11:23:32.441Z",
                  "statuses": [ "active" ]
             },
             "products": [
                {
                    "source": "ul",
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
                    "editions": {
                        "default": {
                            "contexts": { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated": "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

 ## `GET /api/updates/{?source,updated,statuses,offset,limit}`

Return a list of unified products that contain newer information than the record provided by the given source.

 + Parameters
     + `sources` (required, string) ... Only display products from the specified sources.
     + `updatedSince` (optional, string) ... Timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ` Only unified products updated at or after this time are included in the comparison.
     + `statuses` (optional, string) ... The unified record statuses to return (defaults to everything but 'deleted' products).  Can be repeated to include multiple statuses.
     + `offset` (optional, string) ... The number of products to skip in the list of results.  Used for pagination.
     + `limit` (optional, string) ... The number of products to return.  Used for pagination.  Set to `-1` to return all products.  Defaults to `-1`

 + Response 200 (application/search+json)
     + Headers
         + Content-Type: application/record+json; profile=https://registry.gpii.net/schema/updates.json#
         + Link: <https://registry.gpii.net/schema/updates.json#>; rel="describedBy"
     + Body

         ```
         {
             "total_rows": 1,
             "params": {
                  "sources": ["Vlibank"]
                  "updatedSince": "2014-05-25T11:23:32.441Z",
                  "statuses": [ "active" ]
             },
             "products": [
                {
                    "source": "ul",
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
                    "editions": {
                        "default": {
                            "contexts": { "OS": { "id": "android", "version": ">=0.1" } },
                            "settingsHandlers": [],
                            "lifeCycleManager": {}
                        }
                    }
                    "updated": "2014-11-30T22:04:15Z"
                }
             ],
             "retrievedAt": "2014-05-25T11:23:32.441Z"
         }
         ```

