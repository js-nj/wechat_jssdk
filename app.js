var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var querystring = require('querystring')
var ejs = require('ejs')
var path = require('path')
       
var https = require('https')
var http = require('http').Server(app);

var common = require('./common.js')
var sign = require('./sign.js');
var corpData = require('./corpData.js')
var contactsManage = require('./contactsManage.js')
var uploadImgsToEmap = require('./wximg.js')

global.tokenData = {}

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));
app.set('views', path.join(__dirname, 'demo'));
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));
app.locals._layoutFile = 'layout.html';

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin",  "*");
    res.header("Access-Control-Allow-Headers", "Origin,No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1')  
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();  
});

app.get('/',function (req, res) {
  res.render('index.html')
})

// 获取jsapi签名
app.post('/checkSign', function (req, res) {
  var configUrl = req.body.url
  var corpName = req.body.corp || 'amptest'
  // 判断缓存内， 是否有当前corp的ticket信息
  if (global.tokenData[corpName]) {
    // console.log('cache')
    var ticket = tokenData[corpName]['ticket']
    var signatureInfo = sign(ticket, configUrl)
    signatureInfo.corpId = corpData[corpName]['corpid']
    var respData = {
      code: '0',
      data: signatureInfo
    }
    res.end(JSON.stringify(respData))
  } else {
    // console.log('request')
    common.getAccessToken(corpName, function(access_token) {
      // 缓存access_token
      global.tokenData[corpName] = {
        accessToken: access_token
      }
      // 设置access_token的有效期为2小时
      setDuration(corpName)
      getJsapiTicket(access_token, function (ticket) {
        // 缓存ticket
        global.tokenData[corpName]['ticket'] = ticket
        var signatureInfo = sign(ticket, configUrl)
        signatureInfo.corpId = corpData[corpName]['corpid']
        var respData = {
          code: '0',
          data: signatureInfo
        }
        res.end(JSON.stringify(respData))
      }) 
    })
  }
});

// 导入部门
app.post('/importDept', contactsManage.importDept)

app.post('/uploadWxImgsToEmap', uploadImgsToEmap)

app.get('/uploadWxImgsToEmap', uploadImgsToEmap)

http.listen('8888', function () {
	console.log('listen 8888 success')
});

/**
 * 设置有效期为 两小时-10s
 * @param {*} corpName 
 */
function setDuration (corpName) {
  clearTimeout(global.tokenData[corpName]['timer'])
  global.tokenData[corpName]['timer'] = setTimeout(function () {
    if (global.tokenData[corpName]) {
      delete global.tokenData[corpName]
    }
  }, (120 * 60 - 10) * 1000)
}

/**
 * 获取ticket
 * @param {*} access_token 
 * @param {*} success - callback
 */
function getJsapiTicket (access_token, success) {
  var options = {
    host: 'qyapi.weixin.qq.com',
    path: '/cgi-bin/get_jsapi_ticket?access_token=' + access_token,
    method: 'GET'
  }
  common.request(options, function (res, data) {
    success(data.ticket)
  })
}


