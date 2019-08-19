function (head, req) { // jshint ignore:line
    var rows = [];
    var row;
    while (row = getRow()) { // jshint ignore: line
        var sanitized = JSON.parse(JSON.stringify(row.value));
        delete sanitized._id;
        delete sanitized._rev;
        rows.push(sanitized);
    }
    send(JSON.stringify({ docs: rows }, null, 2));
}
