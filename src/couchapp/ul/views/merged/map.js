function(doc) {
    if (doc.source === "unified" && doc.sid !== doc.uid) {
        emit( doc.sid, doc);
    }
}
