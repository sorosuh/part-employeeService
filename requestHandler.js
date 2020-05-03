const db = require('./mongodb')
const Q = require('q');
const axios = require('axios').default;
const http = require('http');
const url = require('url');

function addEmployee(request, response) {

    console.log('add employee called')

    let body = []
    // request.on('data', (chunk) => {
    //     body.push(chunk)
    // })
    request.on('data', (chunk) => {
        body.push(chunk)
        try {
            body = Buffer.concat(body).toString();
            body = JSON.parse(body)

            var headers = request.headers
            var employee = {
                id: body.id,
                data: body.data,
                parent: body.parent,
                org: headers.org
            }

            db.config()
                .then((result) => {
                    console.log(result);
                }).catch((err) => {
                console.log(err);
            });

            db.addEmployee(employee)
                .then((result) => {
                    response.writeHead(200)
                    response.write(result)
                    response.end()

                }).catch((err) => {
                response.writeHead(400)
                response.write(err)
                response.end()
            });
        } catch (e) {
            response.end(e.message)
            console.log(e.message)
        }

    })

}

function getData(request, response) {
    console.log('get data called')
    const queryObject = url.parse(request.url, true).query;
    var id = queryObject.id;
    let body = []
    request.on('data', (chunk) => {
        body.push(chunk)
    }).on('end', () => {

        try {
            let data = {
                id: id,
                org: request.headers.org
            }

            db.getData(data , response)
                .then((result) => {
                    let res = JSON.stringify(result[0].data)
                    response.writeHead(200)
                    response.write(res)
                    response.end()
                }).catch((err) => {
                if (err === 'شناسه پیدا نشد') {
                    response.writeHead(404)
                } else {
                    response.writeHead(400)
                }

                response.write(err);
                response.end()
            });

        } catch (e) {
            response.end(e.message)
        }

    })
}

function editData(request, response) {

    let body = []
    request.on('data', (chunk) => {
        body.push(chunk)
    }).on('end', () => {

        try {
            body = Buffer.concat(body).toString()
            body = JSON.parse(body)

            let obj = {
                id: body.id,
                data: body.data,
                parent: body.parent,
                org: request.headers.org
            }
            db.editData(obj)
                .then((res) => {

                    response.writeHead(200)
                    let msg = {
                        message: res,
                        status: "ok"
                    }
                    response.write(JSON.stringify(msg))
                    response.end()
                }).catch((err) => {
                if (err === ' داده ای با این مشخصات برای بروزرسانی یافت نشد') {
                    response.writeHead(404)
                } else {
                    response.writeHead(400)
                }

                response.write(err)
                response.end()
            });

        } catch (e) {
            response.end(e.message)
        }

    })

}

function deleteEmployee(request, response) {
    console.log('delete employee called')

    var body = "";
    request.on('data', function (chunk) {
        body += chunk;
        db.deleteEmployee(body)
            .then(function (res) {
                response.end(res)
            }).catch(function (err) {
            response.end(err)
        })
    })
}

function getAllEmployee(request, response) {
    console.log('getAllEmployee called')
    let body = []
    request.on('data', (chunk) => {
        body.push(chunk)
    }).on('end', () => {
        try {
            let data = {
                org: request.headers.org
            }

            db.getAllEmployee(data)
                .then((result) => {
                    response.end(JSON.stringify(result))
                }).catch((err) => {
                response.writeHead(400)
                response.end(err)
            });

        } catch (e) {
            response.end(e.message)
        }

    })
}

exports.getData = getData;
exports.editData = editData;
exports.addEmployee = addEmployee;
exports.deleteEmployee = deleteEmployee;
exports.getAllEmployee = getAllEmployee;