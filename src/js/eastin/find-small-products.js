// FindSmallProducts(),
// POST /eastin/products
// Implement after getProduct so we can reuse parts of the transform.
//
// Input parameters:
//  string actorType: the type of the actor; (Hard code to "companies"?)
//  string[] isoCodes: an array of strings representing ISO classes (for example [“12.22”, “09.03.03”]);
//  string[] icfCodes: an array of strings representing the EASTIN ICF classes (for example [“b1”, “d2”]) which are a subset of the official ICF classification;
//  string actorName: the whole or a part of the name of the searched actor;
//  dateTime insertDateMin: the lower bound for the insert date of the actors to be searched;
//  dateTime insertDateMax: the upper bound for the insert date of the actors to be searched.
//
// Returns:
// SmallProductDto
//  string ProductCode*: the id of the product in the partner’s local database;
//  string IsoCodePrimary*: the primary ISO Code of the product (for example “09.03.03”);
//  string[] IsoCodesOptional: the array of all secondary ISO classification codes of the product (for example [“12.22”, “09.03.03”]);
//  string CommercialName*: the commercial name of the product;
//  string ManufacturerCode*: the id of the product’s manufacturer in the partner’s local database;
//  string ManufacturerOriginalFullName*: the full name in the original language of the product’s manufacturer;  dateTime InsertDate*: the insert date of the product;
//  dateTime LastUpdateDate*: the last update date of the product;
//  string ThumbnailImageUrl: the URL of the small format picture of the product (used when displaying list of products in EASTIN Portal). The URL must be accessible on the Web by the end user’s browser. Picture dimensions should be: width 90 px, height 90 px.
