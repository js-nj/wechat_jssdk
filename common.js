var corpData = require('./corpData')
var https = require('https')
module.exports = {
  /**
   * 发起请求
   * @param {*} options 
   * @param {*} cb 
   */
  request: function(options, cb) {
    var request = https.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function(data) {
        var data = JSON.parse(data);
        cb(res, data);
      });
    });
    request.on('error', function(e) {
      console.log("error: " + e.message);
    });
    if (options.data) {
      request.write(require('querystring').stringify(options.data))
      console.log(require('querystring').stringify(options.data))
    }
    request.end();
  },
  /**
   * 企业微信获取accessToken
   * @param {String} corpName
   * @param {Function} success - callback
   */
  getAccessToken: function(corpName, success) {
    if (global.tokenData[corpName]) {
      success(global.tokenData[corpName]['accessToken'])
    } else {
      var corpid = corpData[corpName]['corpid']
      var corpsecret = corpData[corpName]['corpsecret']
      var options = {
        host: 'qyapi.weixin.qq.com',
        path: '/cgi-bin/gettoken?corpid=' + corpid + '&corpsecret=' + corpsecret,
        method: 'GET'
      };
      this.request(options, function(res, data) {
        success(data.access_token)
      })
    }
  },
  /**
   * 服务号获取accessToken
   * @param {String} corpName
   * @param {Function} success - callback
   */
  getServiceAcountAccessToken: function(corpName, success) {
    if (global.tokenData[corpName]) {
      success(global.tokenData[corpName]['accessToken'])
    } else {
      var appid = corpData[corpName]['corpid']
      var appsecret = corpData[corpName]['corpsecret']
      var options = {
        host: 'api.weixin.qq.com',
        path: '/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + appsecret,
        method: 'GET'
      };
      this.request(options, function(res, data) {
        success(data.access_token)
      })
    }
  }
}