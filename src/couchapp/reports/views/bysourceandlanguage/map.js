function (doc) {
    "use strict";
    if (doc.source !== "unified" && doc.status !== "deleted") {
        var lang = doc.language || "none";
        var id = doc.source + ":" + lang;
        emit(id, doc);
    }
}
