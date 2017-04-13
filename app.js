var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var querystring = require('querystring')
var ejs = require('ejs')
var path = require('path')
       
var https = require('https')
var http = require('http').Server(app);

var sign = require('./sign.js');

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
    res.header("Access-Control-Allow-Origin", "*");  
    res.header("Access-Control-Allow-Headers", "X-Requested-With");  
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1')  
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();  
});

app.get('/',function (req, res) {
  res.render('index.html')
})


app.post('/checkSign', function (req, res) {
  var configUrl = req.body.url
  if (!configUrl) {

  }
  getAccessToken(function(resp, data) {
    var access_token = data.access_token
    getJsapiTicket(access_token, function (resp, data) {
      var ticket = data.ticket
      var signatureInfo = sign(ticket, configUrl)
      var respData = {
        code: '0',
        data: signatureInfo
      }
      res.end(JSON.stringify(respData))
    }) 
  })
});

http.listen('8888', function () {
	console.log('listen 8888 success')
});

function getJsapiTicket (access_token, success) {
  var options = {
    host: 'qyapi.weixin.qq.com',
    path: '/cgi-bin/get_jsapi_ticket?access_token=' + access_token,
    method: 'GET'
  }
  request(options, success)
}

function getAccessToken (success){
    var corpid = 'wxac48a3d1834f4605'
    var corpsecret = 'st6U_FE8gukEFan32oNVUONT8HNtLhy0Fn_cdE8SzIVW6YGcKobGLaEbSa6aOOtx'
    var options = {
	    host: 'qyapi.weixin.qq.com',
	    path: '/cgi-bin/gettoken?corpid=' + corpid +  '&corpsecret=' + corpsecret,
	    method: 'GET'
    };
    request(options, success)
}

function request (options, cb) {
  var request = https.request(options, function(res) {
	    res.setEncoding('utf8');
	    res.on('data', function (data) {
	      var data = JSON.parse(data);
	      cb(res,data);
	    });
    });	
    request.on('error', function(e){
       console.log("error: " + e.message);
    });
    request.end();
}