function (doc) {
    "use strict";

    if (doc.isoCodes && doc.isoCodes.length > 0) {
        emit(doc.status +" record, with ISO Code");
    }
    else {
        emit(doc.status + " record, with no ISO Code");
    }
}
