var request = require('request');
var fs = require('fs');

var downloadWxImg = require('./downloadWxImg.js');

var getParam = function(req) {
    if (req.method === 'POST') {
        return req.body;
    }
    return req.query;
};

function uploadImgsToEmap(req, res) {
    let param = getParam(req);
    let fileToken = param.fileToken;
    let scope = param.scope;
    let headers = Object.assign({}, req.headers);
    if (param.origin) {
        headers['Origin'] = param.origin;
    }
    if (param.host) {
        headers['Host'] = param.host;
    }
    if (param.cookie) {
        headers['Cookie'] = param.cookie;
    }

    let config = {
        accessToken: param.accessToken,
        fileToken: fileToken,
        scope: scope,
        prePath: param.emapPrefixPath,
        headers: headers
    };

    var imgs = param.serverIds.map(function(id) {
        return downloadWxImg({
            accessToken: param.accessToken,
            serverId: id,
            fileToken: fileToken,
            scope: scope,
            prePath: param.emapPrefixPath,
            headers: headers
        });
    });
    Promise.all(imgs).then(function() {
        let paths = arguments[0];
        let filePaths = paths.filter(function(file) {
            if (file) {
                return file;
            }
        });
        var uploadURI = config.prePath + '/sys/emapcomponent/file/uploadTempFile.do';
        var formData = {
            fileToken: config.fileToken,
            scope: config.scope,
            storeId: 'image',
            files: filePaths.map(function(filePath) {
                return fs.createReadStream(filePath);
            })
        };
        request.post({
            url: uploadURI,
            headers: config.headers,
            formData: formData
        }, function(err, httpResponse, body) {
            filePaths.forEach(function(filePath) {
                fs.unlinkSync(filePath);
            });
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
            if (err) {
                return res.send({
                    success: false
                });
            }
            var saveData = {
                fileToken: config.fileToken,
                scope: config.scope,
                attachmentParam: JSON.stringify({
                    storeId: 'image'
                })
            };
            var saveURI = config.prePath + `/sys/emapcomponent/file/saveAttachment.do`;
            request.post({
                url: saveURI,
                headers: config.headers,
                formData: saveData
            }, function(error, resp) {
                try {
                    let respJson = JSON.parse(resp.body);
                    let results = paths.map(function(item, i) {
                        if (item) {
                            return {
                                serverId: param.serverIds[i],
                                success: true
                            };
                        }
                        return {
                            serverId: param.serverIds[i],
                            success: false
                        };
                    });
                    if (respJson.success) {
                        res.send({
                            success: true,
                            results: results
                        });
                    } else {
                        res.send({
                            success: false
                        });
                    }
                } catch (e) {
                    res.send({
                        success: false
                    });
                }
            });
        });
    });
}

module.exports = uploadImgsToEmap;
