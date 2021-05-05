function (doc) {
    "use strict";
    var sourcedSid = doc.source + ":" + doc.sid;

    if (doc.isoCodes && doc.isoCodes.length > 0) {
        for (var a = 0; a < doc.isoCodes.length; a++) {
            var isoCode = doc.isoCodes[a];
            emit(isoCode, sourcedSid);
        }
    }
    else {
        emit("none", sourcedSid);
    }
}
