var path = require('path');
var fs = require('fs');
var https = require('https');

var downloadWxImg = function(config) {
    var promise = new Promise(function(resolve, reject) {
        var uri = `https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token=${config.accessToken}&media_id=${config.serverId}`;

        https.get(uri, function(res) {
            var imgData = '';

            var fileName = res.headers['content-disposition'].match(/.+(filename=")(.+)?"/)[2];
            res.setEncoding('binary'); //一定要设置response的编码为binary否则会下载下来的图片打不开

            res.on('data', function(chunk) {
                imgData += chunk;
            });
            res.on('end', function() {
                var dir = './file';
                var dirPath = path.join(__dirname, dir);
                var isDirExisted = fs.existsSync(dirPath);
                if (!isDirExisted) {
                    fs.mkdirSync(dirPath);
                }
                var filePath = path.join(__dirname, `${dir}/${fileName}`);
                fs.writeFile(filePath, imgData, 'binary', function(err) {
                    if (err) {
                        resolve(false);
                    } else {
                        resolve(filePath);
                    }
                });
            });
            res.on('error', function() {
            	resolve(false);
            });
        });
    });
    return promise;
};

module.exports = downloadWxImg;
