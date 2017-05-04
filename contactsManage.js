var common = require('./common.js')
var https = require('https')
var querystring = require('querystring')
var request = require("request");

function converParams(data) {
  var result = []
  for (var k in data) {
    result.push(k + '=' + data[k])
  }
  return result.join('&')
}

module.exports = {
  importDept: function (req, res) {
    var corpName = req.body.corp
    var deptData = JSON.parse(req.body.deptData)
    var token
    if (global.tokenData[corpName]) {
      if (deptData instanceof Array) {
        importArray(0, deptData, function (body) {
          res.end(JSON.stringify(body))
        })
      } else {
        importAction(deptData, function (body) {
          res.end(JSON.stringify(body))
        })
      }
    } else {
      common.getAccessToken(corpName, function (token) {
        global.tokenData[corpName] = {}
        global.tokenData[corpName]['accessToken'] = token
        if (deptData instanceof Array) {
          importArray(0, deptData, function (body) {
            res.end(JSON.stringify(body))
          })
        } else {
          importAction(deptData, function (body) {
            res.end(JSON.stringify(body))
          })
        }
      })
    }

    function importArray(i, deptData, cb) {
      importAction(deptData[i], function (body) {
        i++
        if (deptData[i]) {
          importArray(i, deptData, cb)
        } else {
          cb(body)
        }
      })
    }

    function importAction(data, success) {
      var options = {
        method: 'POST',
        url: 'https://qyapi.weixin.qq.com/cgi-bin/department/create',
        qs: {
          access_token: global.tokenData[corpName]['accessToken']
        },
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'application/json'
        },
        body: data,
        json: true
      };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
        success(body)
      });
    }
  }
}