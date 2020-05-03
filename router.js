
function route(handle, pathname, request, response) {
    console.log("About to route a request for" + pathname);
    if (typeof handle[`${request.method}${pathname}`] === 'function') {
        handle[`${request.method}${pathname}`](request, response);
    } else {
        response.write('درخواست معتبر نیست');
        response.end()
    }
}

exports.route = route;