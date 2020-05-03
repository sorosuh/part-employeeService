var MongoClient = require('mongodb').MongoClient
const url = "mongodb://127.0.0.1:27017/project1"
const Q = require('q')
const http = require('http')
const dbName = "project1"

function config() {

    try {
        let deferred = Q.defer();
        MongoClient.connect(url)
            .then(function (db) {
                console.log('conected');

                var dbo = db.db('project1')
                dbo.createCollection('dataStorage')
                    .then(function (result) {
                        console.log('create dataStorage');
                    })
                    .catch(function (err) {
                        deferred.reject(new Error(err))
                    })

                dbo.createCollection('dataMap')
                    .then(function (result) {
                        console.log('create dataMap')
                    })
                    .catch(function (err) {
                        deferred.reject(new Error(err))
                    })

            })
            .catch(function (err) {
                deferred.reject(new Error('پیام خطا در ارتباط با پایگاه داده'))
            })

        return deferred.promise;
    } catch (e) {
        response.end(e)
    }
}

function addEmployee(obj) {
    let deferred = Q.defer();
    console.log('add employee called')
    MongoClient.connect(url)
        .then(function (db) {
            let dbo = db.db('project1')
            Q.all([
                insertDataStorage(obj),
                insertDataMap({id: obj.id, parent: obj.parent})
            ]).then((result) => {
                deferred.resolve('داده ها باموفقیت ذخیره شد' + result)
            }).fail((error) => {

                var dataStorage = dbo.collection('dataStorage').find({
                    id: obj.id,
                    org: obj.org
                }).toArray(function (err, res) {
                    if (err) {
                        deferred.reject(err)
                    }
                    console.log(res)
                    console.log(res.length);
                    if (res.length > 1) {
                        dbo.collection('dataStorage').deleteOne({id: obj.id, org: obj.org}, function (err, result) {
                            console.log(res.length);
                        })
                    }

                })

                var dataMap = dbo.collection('dataMap').find({
                    id: obj.id,
                    parent: obj.parent
                }).toArray(function (err, res) {
                    if (err) {
                        deferred.reject(err)
                    }
                    console.log(res.length);
                    if (res.length > 1) {
                        dbo.collection('dataMap').deleteOne({id: obj.id, parent: obj.parent}, function (err, result) {
                            if (err) return err
                            console.log(res.length);
                        })
                    }
                })

                deferred.reject(error)
            });

        }).catch(function (err) {
        deferred.reject('خطا در ارتباط با پایگاه داده')
    })


    return deferred.promise;
}

function insertDataStorage(obj) {
    let deferred = Q.defer();

    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject(new Error(' خطا در ارتباط با پایگاه داده'))
        }
        let dbo = db.db('project1')
        dbo.collection('dataStorage').find({org: obj.org, id: obj.id}).toArray(function (err, res) {
            if (err)
                deferred.reject('can not find')
            if (res.length === 0) {

                let newObj = {
                    id: obj.id,
                    data: obj.data,
                    org: obj.org
                }

                dbo.collection('dataStorage').insertOne(newObj, function (err, res) {
                    if (err)
                        deferred.reject('not insert in dataStorage')
                    deferred.resolve('data insert in dataStorage')
                })
            } else {
                console.log(' Repetitious data in dataStorage')
                deferred.reject('شناسه داده ها تکراری است')
            }


        })
    })
    return deferred.promise;
}

function insertDataMap(obj) {
    let deferred = Q.defer();

    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject(new Error(' خطا در ارتباط با پایگاه داده'))
        }
        let dbo = db.db('project1')

        dbo.collection('dataMap').insertOne(obj, function (err, res) {
            if (err)
                deferred.reject('not insert in dataMap')
            deferred.resolve('data insert in dataMap')
        })

        /*        dbo.collection('dataMap').find({id: obj.id, parent: obj.parent}).toArray(function (err, res) {
                    if (err)
                        deferred.reject('can not find')
                    if (res.length === 0) {

                        dbo.collection('dataMap').insertOne(obj, function (err, res) {
                            if (err)
                                deferred.reject('not insert in dataMap')
                            deferred.resolve('data insert in dataMap')
                        })
                    } else {
                        console.log(' Repetitious data in dataMap')
                        deferred.reject('شناسه داده ها تکراری است')
                    }
                })*/


    })
    return deferred.promise;
}

function getData(obj, response) {

    let deferred = Q.defer();
    console.log("search")
    console.log(obj.org)
    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject(new Error('پیام خطا در ارتباط با پایگاه داده'))
        }
        var dbo = db.db("project1");
        dbo.collection("dataStorage").find({org: obj.org, id: obj.id},
            {projection: {_id: 0, data: 1}}).toArray(function (err, result) {
            if (err) {
                deferred.reject(err)
            } else if (result.length !== 0) {
                deferred.resolve(result)
                db.close();
            } else {
                console.log(result)
                deferred.reject('شناسه پیدا نشد')
            }
        })
    });

    return deferred.promise
}

function editData(obj) {
    var deferred = Q.defer()

    Q.all([
        editDataMap(obj),
        editDataStorage(obj)
    ])
        .then((res) => {
            deferred.resolve(res)
        }).fail((error) => {
        deferred.reject(error)
    });

    return deferred.promise;
}

function editDataStorage(obj) {
    var deferred = Q.defer()
    let myquery = {id: obj.id, org: obj.org};
    let newvalues = {$set: {id: obj.id, data: obj.data, parent: obj.parent, org: obj.org}};
    console.log('editDataStorage called');
    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject('خطای اتصال به پایگاه داده')
        } else {
            let dbo = db.db(dbName)
            dbo.collection('dataStorage').find({id: obj.id, org: obj.org}).toArray(function (err, res) {
                if (err) {
                    throw err
                }

                if (res.length == 0) {
                    deferred.reject(' داده ای با این مشخصات برای بروزرسانی یافت نشد')
                }

                if (res.length > 0) {
                    dbo.collection("dataStorage").updateOne(myquery, newvalues)
                        .then((result) => {
                            deferred.resolve('داده با موفقیت بروزرسانی شد')
                        }).catch((err) => {
                        deferred.reject(err)
                    });
                }
            })
        }
    })

    return deferred.promise;
}

function editDataMap(obj) {
    var deferred = Q.defer()
    let myquery = {id: obj.id};
    let newvalues = {$set: {id: obj.id, parent: obj.parent}};
    console.log('editDataMap called');
    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject('خطای اتصال به پایگاه داده')
        } else {
            let dbo = db.db(dbName)
            dbo.collection('dataMap').find({id: obj.id}).toArray(function (err, res) {
                if (err) {
                    throw err
                }

                if (res.length == 0) {
                    deferred.reject(' داده ای با این مشخصات برای بروزرسانی یافت نشد')
                }

                if (res.length > 0) {
                    dbo.collection("dataMap").updateOne(myquery, newvalues)
                        .then((result) => {
                            deferred.resolve('داده با موفقیت بروزرسانی شد')
                        }).catch((err) => {
                        deferred.reject(err)
                    });
                }
            })
        }
    })

    return deferred.promise;
}

function deleteEmployeeFromDataStorage(obj) {
    var deferred = Q.defer()
    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject('خظای اتصال به پایگاه داده')
        }
        var dbo = db.db("project1");
        obj = JSON.parse(obj)
        var myquery = {id: obj.id};

        dbo.collection('dataStorage').find(myquery).toArray(function (err, res) {
            if (err) {
                throw err
            }

            if (res.length == 0) {
                deferred.reject(' داده ای با این مشخصات برای حذف یافت نشد')
            }

            if (res.length > 0) {
                dbo.collection("dataStorage").deleteOne(myquery, function (err, obj) {
                    if (err) {
                        deferred.reject(err)
                    } else {
                        console.log(obj.result.n + " document deleted from dataStorage");
                        deferred.resolve('delete from dataStorage')
                    }
                    db.close();
                });
            }
        })

    });

    return deferred.promise;
}

function deleteEmployeeFromDataMap(obj) {
    var deferred = Q.defer()
    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject('خظای اتصال به پایگاه داده')
        }
        var dbo = db.db("project1");
        obj = JSON.parse(obj)
        var myquery = {id: obj.id, parent: obj.parent};

        dbo.collection('dataMap').find(myquery).toArray(function (err, res) {
            if (err) {
                throw err
            }

            if (res.length == 0) {
                deferred.reject(' داده ای با این مشخصات برای حذف یافت نشد')
            }

            if (res.length > 0) {
                dbo.collection("dataMap").deleteOne(myquery, function (err, obj) {
                    if (err) {
                        deferred.reject(err)
                    } else {
                        console.log(obj.result.n + " document deleted from dataMap");
                        deferred.resolve('delete from dataMap')
                    }
                    db.close();
                });
            }
        })

    });

    return deferred.promise;
}

function deleteEmployee(obj) {
    console.log('delete method called')
    var deferred = Q.defer()
    Q.all([
        deleteEmployeeFromDataStorage(obj),
        deleteEmployeeFromDataMap(obj)
    ])
        .then((result) => {
            console.log(result)
            deferred.resolve(result)
        })
        .catch((error) => {
            console.log(error)
            deferred.reject(error)
        })
    return deferred.promise
}

function getAllEmployee(data) {

    let deferred = Q.defer();
    console.log("getAllEmployee")

    MongoClient.connect(url, function (err, db) {
        if (err) {
            deferred.reject(new Error(' خطا در ارتباط با پایگاه داده'))
        }
        var dbo = db.db("project1");
        dbo.collection("dataStorage").find({org: data.org},
            {projection: {_id: 0, data: 1}}).toArray(function (err, result) {
            if (err) {
                deferred.reject(err)
            } else if (result.length !== 0) {
                deferred.resolve(result)
                db.close();
            } else {
                console.log('داده ِي مورد نظر یافت نشد')
                deferred.reject(err)
            }
        })
    });

    return deferred.promise;
}


exports.config = config;
exports.addEmployee = addEmployee;
exports.getData = getData;
exports.editData = editData;
exports.deleteEmployee = deleteEmployee;
exports.getAllEmployee = getAllEmployee;



