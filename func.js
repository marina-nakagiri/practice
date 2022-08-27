exports.func = {
  setRelativePath : function setRelativePath(filename){
    var depth = filename.replace(/\\/g, '/').split('src/html/pages')[1].split('/').length - 2;
    var path = depth > 0 ? '../'.repeat(depth) : './';
    return path;
  }
};
