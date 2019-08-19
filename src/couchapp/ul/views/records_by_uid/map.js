function (doc) {
    if (doc.uid) { emit(doc.uid, doc); }
}
