var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var Q = require('q');
var request = Q.nfbind(require('request'));
var brands = ['shoptime', 'americanas', 'submarino'];


app.listen(process.env.PORT || 5000);


console.log(process.env.PORT);
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
};


// var Promise = require("bluebird");
// var request = Promise.promisifyAll(require("request"));

// var urlList = ["https://api.submarino.com.br/v1/oascache/info", "https://api.shoptime.com.br/v1/oascache/info", "https://api.americanas.com.br/v1/oascache/info"];
// Promise.map(urlList, function(url) {
//     return request.getAsync(url).spread(function(body) {
//         return JSON.parse(body);
//     });
// }).then(function(results) {
//      console.log(results);
// }).catch(function(err) {
//      console.log(err);
// });





function requestUrl(socket){

  var promises = [];

  brands.forEach(function (brand){
    var deferred = Q.defer();
    var options = {url: 'https://api.'+ brand +'.com.br/v1/oascache/info'};
    promises.push(request(options, function (error, msg, body) {
      if (error) {
        deferred.reject();
      }
      deferred.resolve();
    }));
  })

  Q.all(promises).then (function (resp) {
    var body = resp;
    var arr = [];

    resp.forEach(function(obj){

      brand = obj[0].request.uri.host.replace("api.", "");
      brand = brand.replace(".com.br", "");

      body = JSON.parse(obj[0].body);

      var oas = body.oas[brand];
      var oassitepage = body.oassitepage[brand];
      var ftpupload = body.ftpupload[brand];
      arr.push({ 'oas' : oas, 'oassitepage': oassitepage, 'ftpupload': ftpupload, 'brand' : brand });
    });

    socket.emit('news', { 'brands': arr });
  }).catch(function(err){
    console.log(err);
  });

  // var url = 'https://api.'+brand+'.com.br/v1/oascache/info';
  // request({
  //     uri: url,
  //     method: "GET",
  //     timeout: 10000,
  //     followRedirect: true,
  //     maxRedirects: 10
  //   }, function(error, response, body) {

  //     body = JSON.parse(body);

  //     var oas = body.oas[brand];
  //     var oassitepage = body.oassitepage[brand];
  //     var ftpupload = body.ftpupload[brand];

  //     socket.emit('news', { 'oas' : oas, 'oassitepage': oassitepage, 'ftpupload': ftpupload, 'brand' : brand });
  //   });  
};

io.on('connection', function (socket) {

  var timer = 10000;
  setInterval(function(){
    requestUrl(socket)
  }, timer);

  requestUrl(socket);

  //socket.emit('news', { hello: 'world' });
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });
});
