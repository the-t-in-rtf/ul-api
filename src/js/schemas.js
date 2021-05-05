"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.ul.api.schemas");

    gpii.ul.api.schemas.generateRequiredHolder = function (original) {
        return fluid.transform(original, function (singleEntry) {
            var updatedEntry = fluid.copy(singleEntry);
            updatedEntry.required = true;
            return updatedEntry;
        });
    };

    /*

        The GSS language use for our schemas intentionally lacks the $ref construct used to compose complex schemas out
        of smaller parts.  This file takes the snippets reused and presents them as sub-schema holding namespaced
        global variables which can be referred to directly when defining input schemas.

        Most of these are not actually schemas themselves, but can be easily converted.  For example, to make a
        "product" schema, you would simply wrap the list of sub-schemas in a "properties" attribute:

        {
            properties: gpii.ul.api.schemas.product
        }

        The one exception is gpii.ul.api.schemas.sortBy, which is itself a complete schema for a single field.

     */

    gpii.ul.api.schemas.output = {
        "includeSources": {
            "type": "boolean"
        },
        "unified": {
            "type": "boolean"
        }
    };

    gpii.ul.api.schemas.paging = {
        "total_rows": {
            "type": "number",
            "description": "The total number of rows that match the input parameters."
        },
        "offset": {
            "type": "number",
            "description": "The position of the first record to return.  Defaults to zero (the first record in the set)."
        },
        "limit": {
            "type": "number",
            "description": "The number of records to return."
        }
    };

    gpii.ul.api.schemas.sortBy = {
        "anyOf": [
            {
                "type": "string"
            },
            {
                "type": "array",
                "description": "An array of field names, prefixed with / for ascending order and \\ for descending order.",
                "items": {
                    "type": "string"
                }
            }
        ]
    };

    gpii.ul.api.schemas.product = {
        "source": {
            "type": "string",
            "description": "The source of a record.  If the record is provided by a source database, this field will be set to a unique string identifying the source.  If this record is unique to the Unified Listing, this field will be set to 'ul'.",
            "minLength": 1,
            "maxLength": 50,
            "errors": {
                "type": "You must provide a source name for this product.",
                "minLength": "You must provide a source name for this product.",
                "maxLength": "You must provide a source name for this product."
            }
        },
        "sid": {
            "type": "string",
            "description": "The unique identifier to identify this record in the source database.",
            "minLength": 1,
            "maxLength": 100,
            "errors": {
                "type": "You must provide a source ID for this product.",
                "minLength": "You must provide a source ID for this product.",
                "maxLength": "You must provide a source ID for this product."
            }
        },
        "uid": {
            "type": "string",
            "description": "The Universal ID ('uid') is an id that is unique in the Unified listing and which is constant for different editions of a product.  'Source' records use this field to indicate which 'unified' record they are associated with (if any).",
            "minLength": 1,
            "maxLength": 100,
            "errors": {
                "type": "You must provide the ID of the Unified Listing for this product.",
                "minLength": "You must provide the ID of the Unified Listing for this product.",
                "maxLength": "You must provide the ID of the Unified Listing for this product."
            }
        },
        "name": {
            "type": "string",
            "minLength": 1,
            "description": "The name of the product.",
            "errors": {
                "type": "You must provide the name of the product.",
                "minLength": "You must provide the name of the product."
            }
        },
        "description": {
            "type": "string",
            "minLength": 1,
            "description": "A description of the product.",
            "errors": {
                "type": "The product description must be a string.",
                "minLength": "The product description must be one or more characters long."
            }
        },
        "manufacturer": {
            "type": "object",
            "description": "A JSON object describing the manufacturer.",
            "properties": {
                "name": {
                    "required": true,
                    "type": "string",
                    "minLength": 1,
                    "description": "The name of the manufacturer.",
                    "errors": {
                        "type": "The product manufacturer's name must be a string.",
                        "minLength": "The product manufacturer's name must be one or more characters long."
                    }
                },
                "id": {
                    "type": "integer",
                    "description": "The unique identification number for the product manufacturer.",
                    "errors": {
                        "type": "The manufacturer ID must be a number."
                    }
                },
                "address": {
                    "type": "string",
                    "minLength": 1,
                    "description": "The street address of the manufacturer (may also be used for the complete address).",
                    "errors": {
                        "type": "The manufacturer's address must be a string.",
                        "minLength": "The manufacturer's address must be one or more characters long."
                    }
                },
                "postalCode": {
                    "type": "string",
                    "minLength": 1,
                    "description": "The postal code (ZIP code, etc.) of the manufacturer.",
                    "errors": {
                        "type": "The manufacturer's postal code must be a string.",
                        "minLength": "The manufacturer's postal code must be one or more characters long."
                    }
                },
                "cityTown": {
                    "type": "string",
                    "minLength": 1,
                    "description": "The city/town in which the manufacturer is located.",
                    "errors": {
                        "type": "The manufacturer's city/town must be a string.",
                        "minLength": "The manufacturer's city/town must be one or more characters long."
                    }
                },
                "provinceRegion": {
                    "type": "string",
                    "minLength": 1,
                    "description": "The province/region in which the manufacturer is located.",
                    "errors": {
                        "type": "The manufacturer's province/region must be a string.",
                        "minLength": "The manufacturer's province/region must be one or more characters long."
                    }
                },
                "country": {
                    "type": "string",
                    "minLength": 1,
                    "description": "The country in which the manufacturer is located.",
                    "errors": {
                        "type": "The manufacturer's country must be a string.",
                        "minLength": "The manufacturer's country must be one or more characters long."
                    }
                },
                "phone": {
                    "type": "string",
                    "minLength": 1,
                    "description": "The phone number of the manufacturer.",
                    "errors": {
                        "type": "The manufacturer's phone number must be a string.",
                        "minLength": "The manufacturer's phone number must be one or more characters long."
                    }
                },
                "email": {
                    "type": "string",
                    "format": "email",
                    "description": "An email address at which the manufacturer can be contacted.",
                    "errors": {
                        "type": "The manufacturer's email address must be a string.",
                        "form": "The manufacturer's email address must be valid."
                    }
                },
                "url": {
                    "type": "string",
                    "description": "The manufacturer's web site.",
                    "format": "uri",
                    "errors": {
                        "type": "The manufacturer's URL  must be a string.",
                        "minLength": "The manufacturer's URL must be a valid URL."
                    }
                }
            }
        },
        "status": {
            "enum": [
                "new",
                "active",
                "discontinued",
                "deleted"
            ],
            "enumLabels": [
                "New",
                "Active",
                "Discontinued",
                "Deleted"
            ],
            "description": "The status of this record. Current supported values are: 'new', 'active', 'discontinued', 'deleted'.",
            "errors": {
                "type": "You must provide a valid status.  Currently supported values are: 'new', 'active', 'discontinued', and 'deleted'.",
                "enum": "You must provide a valid status.  Currently supported values are: 'new', 'active', 'discontinued', and 'deleted'."
            }
        },
        "language": {
            "type": "string",
            "pattern": "^[a-zA-Z]{2}_[A-Za-z]{2}$",
            "description": "The language used in the text of this record, expressed using a two letter language, code, an underscore, and a two letter country code, as in `en_us` or `it_it`.  If this is not specified, `en_us` is assumed.",
            "errors": {
                "pattern": "You must provide a valid language code (ex: en_us).",
                "type": "You must provide a valid language code (ex: en_us)."
            }
        },
        "sourceData": {
            "type": "object",
            "description": "The original source record represented as a JSON object."
        },
        "sourceUrl": {
            "type": "string",
            "format": "uri",
            "description": "A URI where the original source record can be viewed on the provider's site."
        },
        "sources": {
            "type": "array",
            "description": "A list of records that are associated with this one.  Only used by 'unified' records.",
            "items": {
                "type": "string"
            }
        },
        "updated": {
            "type": "string",
            "format": "date-time",
            "description": "The date at which the record was last updated.",
            "errors": {
                "format": "You must provide a valid date.",
                "type": "You must provide a valid date."
            }
        },
        "isoCodes":{
            "type": "array",
            "description": "An array of ISO 9999 codes indicating the category of assistive product.",
            "items": {
                "type": "object",
                "properties": {
                    "Name": { "type": "string" },
                    "Code": { "type": "string" }
                },
                "additionalProperties": false
            }
        }
    };

    fluid.registerNamespace("gpii.ul.api.schemas.required");
    gpii.ul.api.schemas.required.product = gpii.ul.api.schemas.generateRequiredHolder(gpii.ul.api.schemas.product);

    gpii.ul.api.schemas.filters = {
        "updatedSince": {
            "type": "string",
            "anyOf": [
                {
                    "format": "date-time"
                },
                {
                    "format": "date"
                }
            ],
            "errors": {
                "type": "You must supply a valid date in ISO 8601 string format.",
                "anyOf": "You must supply a valid date in ISO 8601 string format."
            }
        },
        "status": {
            "anyOf": [
                gpii.ul.api.schemas.product.status,
                {
                    "type": "array",
                    "items": gpii.ul.api.schemas.product.status
                }
            ],
            "errors": {
                "anyOf": "Invalid status.  See the API docs for supported values."
            }
        },
        "sources": {
            "anyOf": [
                gpii.ul.api.schemas.product.source,
                {
                    "type": "array",
                    "items": gpii.ul.api.schemas.product.source
                }
            ]
        }
    };
})(fluid);
