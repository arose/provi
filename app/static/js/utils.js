if(typeof window.console === "undefined") {
    /**
     * fake window.console to catch forgotten debug statements
     * in a non debug environment
     * @ignore
     */
    window.console = { log: function() { } };
}

if (window.opera && !window.console) {
    /**
     * window.console implementation for Opera
     * @ignore
     */
    window.console = {};
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
    /** @ignore */
    window.console.log = function() {
        opera.postError(arguments);
    }
}


/**
    A function for the Array object to reduce an array to unique elements
    @function
    @addon
 */
Array.prototype.unique = function () {
    var r = new Array();
    o:for(var i = 0, n = this.length; i < n; i++){
        for(var x = 0, y = r.length; x < y; x++){
            if(r[x]==this[i]){
                continue o;
            }
        }
        r[r.length] = this[i];
    }
    return r;
}

/**
    A function for the Array object to compute the intersection of two arrays
    @param {Array} setB the array used for the intersection
    @function
    @addon
 */
Array.prototype.intersection = function( setB ) {
   var setA = this;

   var setA_seen = {};
   var setB_seen = {};
   for ( var i = 0; i < setB.length; i++ ) {
      setB_seen[ setB[i] ] = true;
   }

   var intersection = [];
   for ( var i = 0; i < setA.length; i++ ) {
      if ( !setA_seen[ setA[i] ] ) {
         setA_seen[ setA[i] ] = true;
         if ( setB_seen[ setA[i] ] ) {
            intersection.push( setA[i] );
         }
      }
   }
   return intersection;
};


/**
 * Array Remove - By John Resig (MIT Licensed)
 * @addon
 */
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

/**
 * @addon
 */
Array.prototype.removeItems = function(itemsToRemove, testFn) {

    if ( !/Array/.test(itemsToRemove.constructor) ){
        itemsToRemove = [ itemsToRemove ];
    }
    
    if(!testFn){
        testFn = function(a, b){
            return a == b;
        }
    }
    
    var j;
    for (var i = 0; i < itemsToRemove.length; i++){
        j = 0;
        while (j < this.length) {
            if ( testFn(this[j], itemsToRemove[i]) ){
                this.splice(j, 1);
            } else {
                j++;
            }
        }
    }
}


if (!Array.prototype.reduce)
{
  Array.prototype.reduce = function(fun /*, initial*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var i = 0;
    if (arguments.length >= 2)
    {
      var rv = arguments[1];
    }
    else
    {
      do
      {
        if (i in this)
        {
          rv = this[i++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++i >= len)
          throw new TypeError();
      }
      while (true);
    }

    for (; i < len; i++)
    {
      if (i in this)
        rv = fun.call(null, rv, this[i], i, this);
    }

    return rv;
  };
}




/**
 * Utility functions
 */
Utils = {};

Utils.object_size_fn = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * extend the prototype of an object with another
 * @return the new extended object
 */
Utils.extend = function(f, e) {
    function g() {}
    g.prototype = f.prototype || f;
    var new_class = new g();
    for (name in e) {
        new_class[name] = e[name];
    }
    return new_class;
};

Utils.get_class = function(obj) {
    // Retrieves the class name  
    // 
    // version: 1004.2314
    // discuss at: http://phpjs.org/functions/get_class    // +   original by: Ates Goral (http://magnetiq.com)
    // +   improved by: David James
    // *     example 1: get_class(new (function MyClass() {}));
    // *     returns 1: "MyClass"
    // *     example 2: get_class({});    // *     returns 2: "Object"
    // *     example 3: get_class([]);
    // *     returns 3: false
    // *     example 4: get_class(42);
    // *     returns 4: false    // *     example 5: get_class(window);
    // *     returns 5: false
    // *     example 6: get_class(function MyFunction() {});
    // *     returns 6: false
    if (obj instanceof Object && !(obj instanceof Array) &&         !(obj instanceof Function) && obj.constructor &&
        obj != this.window) {
        var arr = obj.constructor.toString().match(/function\s*(\w+)/);
 
        if (arr && arr.length == 2) {            return arr[1];
        }
    }
 
    return false;
}

/**
    @function
 */
Utils.wait = function(timeout, checkFn, onEndFn) {
    if (checkFn()){
        onEndFn();
    } else {
        setTimeout(function(){
            Utils.wait(timeout, checkFn, onEndFn);
        }, timeout);
    }
}

Utils.in_array = function(array, item, testFn) {
    if(!testFn){
        /** @ignore */
        testFn = function(a, b){
            return a == b;
        }
    }
    
    var j = 0;
    while (j < array.length) {
        if ( testFn(array[j], item) ){
            return true
        } else {
            j++;
        }
    }
    return false;
}