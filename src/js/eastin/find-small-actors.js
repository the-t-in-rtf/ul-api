// FindSmallActors()
// POST /actors
// Return manufacturers? Need to look at examples.
//  string actorType: the type of the actor;
//  string[] isoCodes: an array of strings representing ISO classes (for example [“12.22”, “09.03.03”]);
//  string[] icfCodes: an array of strings representing the EASTIN ICF classes (for example [“b1”, “d2”])
// which are a subset of the official ICF classification;
//  string actorName: the whole or a part of the name of the searched actor;
//  dateTime insertDateMin: the lower bound for the insert date of the actors to be searched;
//  dateTime insertDateMax: the upper bound for the insert date of the actors to be searched. string actorType: the type of the actor;
//  string[] isoCodes: an array of strings representing ISO classes (for example [“12.22”, “09.03.03”]);
//  string[] icfCodes: an array of strings representing the EASTIN ICF classes (for example [“b1”, “d2”])
//
// Returns a SmallActorDTO, i. e.
//
//  string ActorCode*: the id of the actor in the EASTIN partner’s local database;
//  string OriginalFullName*: the full name of the actor in the original language;
//  string Country*: the country code of the actor in ISO 3166-1-alpha-2 code (for example “IT”, “US”, etc.);
//  dateTime InsertDate*: the insert date of the actor in the EASTIN partner’s local database;
//  dateTime LastUpdateDate*: the insert date of the actor in the EASTIN partner’s local database.

// findSmallActors: {
//     type: "gpii.ul.api.eastin.actors"
// },
