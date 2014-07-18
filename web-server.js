#!/usr/bin/env node

var util = require('util'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path=require("path"),
    mime=require("./mime").mime;

var ROOT      ="C:\\"; //Set Root Directory
var FILE_PORT = 8003;
var HOST      = "127.0.0.1";

function main(argv) {
    //Create server
    http.createServer(function(req,res){
        //Change space with '%20' in url, otherwise the file could not be found by node.js
        var pathname=url.parse(req.url).pathname.replace(/%20/g,' '),
            re=/(%[0-9A-Fa-f]{2}){3}/g;
        //Use utf-8 code to indicate chinese character
        pathname=pathname.replace(re,function(word){
            var buffer=new Buffer(3),
                array=word.split('%');
            array.splice(0,1);
            array.forEach(function(val,index){
                buffer[index]=parseInt('0x'+val,16);
            });
            return buffer.toString('utf8');
        });
        console.log("pathname : " + pathname);
        if(pathname=='/'){
            listDirectory(root,req,res);
        }else{
            filename=path.join(root,pathname);
            path.exists(filename,function(exists){
                if(!exists){
                    util.error('Cound not find file : '+filename);
                    write404(req,res);
                }else{
                    fs.stat(filename,function(err,stat){
                        if(stat.isFile()){
                            showFile(filename,req,res);
                        }else if(stat.isDirectory()){
                            listDirectory(filename,req,res);
                        }
                    });
                }
            });
        }
    }).listen(Number(argv[1]) || FILE_PORT, Number(argv[2]) || HOST);
}

if(!path.existsSync(ROOT)){
    util.error(ROOT+"Directory not exist, please redefine the root directory!");
    process.exit();
}

// List the files in parent directory
function listDirectory(parentDirectory,req,res){
    fs.readdir(parentDirectory,function(error,files){
        var body=formatBody(parentDirectory,files);
        res.writeHead(200,{
            "Content-Type":"text/html;charset=utf-8",
            "Content-Length":Buffer.byteLength(body,'utf8'),
            "Server":"NodeJs("+process.version+")"
        });
        res.write(body,'utf8');
        res.end();
    });
}

// Display the content in file
function showFile(file,req,res){
    fs.readFile(filename,'binary',function(err,file){
        var contentType=mime.lookupExtension(path.extname(filename));
        res.writeHead(200,{
            "Content-Type":contentType,
            "Content-Length":Buffer.byteLength(file,'binary'),
            "Server":"NodeJs("+process.version+")"
        });
        res.write(file,"binary");
        res.end();
    })
}

// Display the file list in the web page, with the format of ul->li
function formatBody(parent,files){
    var res=[],
        length=files.length;
    res.push("<!doctype>");
    res.push("<html>");
    res.push("<head>");
    res.push("<meta http-equiv='Content-Type' content='text/html;charset=utf-8'></meta>");
    res.push("<title>Node.js File Server</title>");
    res.push("<style>li:nth-of-type(even){background-color: #EEEEEE;}</style>");
    res.push("</head>");
    res.push("<body width='100%'>");
    res.push("<div style='position:relative;bottom:5px;height:30px;background:gray'>");
    res.push("<div style='margin:0 auto;height:100%'>");
    res.push("<span style='font-size: 22px;line-height: 30px;text-align: left;font-weight: bold;float:left;color: #ffffff;'>Directory Listing For "
        + parent
        + "</span>");
    res.push("<span style='font-size: 22px;line-height: 30px;text-align: right;font-weight: bold;float:right;'>"
        + "<a style='color:#ffffff' href='http://localhost:8000/app/index.html'>Return to NSESH page</a>"
        + "</span>");
    res.push("</div>");
    res.push("<hr>");
    res.push("<ul style='list-style: none;padding-left:0px'>");
    if(parent != ROOT) {
        var parentURL = parent.split(ROOT)[1];
        var basename = path.basename(parent);
        var parentDir = parentURL.split(basename)[0];
        console.log("parentURL : " + parentURL);
        console.log("basename : " + basename);
        console.log("parentDir : " + parentDir);
        res.push("<li style='font-family: monospace;font-size: 16px;line-height: 16px;margin: 6px 0;text-indent: 20px;'>" +
            "<a href='"+"/"+parentDir+"'>../</a></li>");
    }
    files.forEach(function(val,index){
        console.log("val : " + val);
        console.log("parent : " + parent);
        try {
            var stat=fs.statSync(path.join(parent,val));
            var parentSplits = parent.split(ROOT);
            var parentPath = parentSplits[1];
            if(stat.isDirectory(val)) {
                val = path.basename(val) + "/";
            } else {
                val=path.basename(val);
            }
            if(parentPath == "") {
                res.push("<li style='font-family: monospace;font-size: 16px;line-height: 16px;margin: 6px 0;text-indent: 20px;'><a href='"+"/"+val+"'>"+val+"</a></li>");
            } else {
                res.push("<li style='font-family: monospace;font-size: 16px;line-height: 16px;margin: 6px 0;text-indent: 20px;'><a href='"+"/"+parentPath+"/"+val+"'>"+val+"</a></li>");
            }
        } catch(e) {
            res.push("<li>" + e.message + "</li>");
        }
    });
    res.push("</ul>");
    res.push("<hr>");
    res.push("<div style='position:relative;bottom:5px;height:25px;background:gray'>");
    res.push("<div style='margin:0 auto;height:100%;line-height:25px;text-align:center'>Powered By Node.js</div>");
    res.push("</div>")
    res.push("</body>");
    return res.join("");
}

// Return 404 code if file not exist
function write404(req,res){
    var body="File not found.";
    res.writeHead(404,{
        "Content-Type":"text/html;charset=utf-8",
        "Content-Length":Buffer.byteLength(body,'utf8'),
        "Server":"NodeJs("+process.version+")"
    });
    res.write(body);
    res.end();
}


// ---------------------------- End --------------------------------

// Must be last
main(process.argv);
