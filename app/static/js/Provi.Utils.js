/**
 * @fileOverview This file contains the {@link Provi.Utils} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


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


if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun, thisp)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
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
 * jQuery.fn.sortElements
 * http://james.padolsey.com/javascript/sorting-elements-with-jquery/
 * --------------
 * @param Function comparator:
 *   Exactly the same behaviour as [1,2,3].sort(comparator)
 *   
 * @param Function getSortable
 *   A function that should return the element that is
 *   to be sorted. The comparator will run on the
 *   current collection, but you may want the actual
 *   resulting sort to occur on a parent or another
 *   associated element.
 *   
 *   E.g. $('td').sortElements(comparator, function(){
 *      return this.parentNode; 
 *   })
 *   
 *   The <td>'s parent (<tr>) will be sorted instead
 *   of the <td> itself.
 */
jQuery.fn.sortElements = (function(){
 
    var sort = [].sort;
 
    return function(comparator, getSortable) {
 
        getSortable = getSortable || function(){return this;};
 
        var placements = this.map(function(){
 
            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,
 
                // Since the element itself will change position, we have
                // to have some way of storing its original position in
                // the DOM. The easiest way is to have a 'flag' node:
                nextSibling = parentNode.insertBefore(
                    document.createTextNode(''),
                    sortElement.nextSibling
                );
 
            return function() {
 
                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }
 
                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);
                // Remove flag:
                parentNode.removeChild(nextSibling);
 
            };
 
        });
 
        return sort.call(this, comparator).each(function(i){
            placements[i].call(getSortable.call(this));
        });
 
    };
 
})();


/**
 * @namespace
 * Provi utils module
 */
Provi.Utils = {};


(function() {



Provi.Utils.event = {
    _keys: { 18:'alt', 16:'shift', 91:'meta', 17:'ctrl' },
    init: function(){
        var self = this;
        $(document).keydown(function(event) {
            //console.log(event);
            $.each( self._keys, function( code, name ){
                //console.log( event[ name + 'Key' ] );
                if( event[ name + 'Key' ] || event.which == code ) self[ name + 'Key' ] = true;
            });
        });
        $(document).keyup(function(event){
            $.each( self._keys, function(){
                self[ this + 'Key' ] = false;
            });
        });
    }
}


Provi.Utils.object_size_fn = function(obj) {
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
Provi.Utils.extend = function(f, e) {
    function g() {}
    g.prototype = f.prototype || f;
    var new_class = new g();
    for (name in e) {
        new_class[name] = e[name];
    }
    return new_class;
};

Provi.Utils.get_class = function(obj) {
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
Provi.Utils.wait = function(timeout, checkFn, onEndFn) {
    if (checkFn()){
        onEndFn();
    } else {
        setTimeout(function(){
            Provi.Utils.wait(timeout, checkFn, onEndFn);
        }, timeout);
    }
}

Provi.Utils.pause = function(ms){
    var start_date = new Date();
    do{ var current_date = new Date() }
    while( current_date - start_date < ms );
}

/**
 * @param {array} array The array where the item is searched.
 * @param {mixed} item The item to look for.
 * @param {function} testFn A function (array_member, item) to compare the given item and the array members.
 * @returns {boolean} Weather or not the item is contained in the array
 */
Provi.Utils.in_array = function(array, item, testFn) {
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

/**
 * http://james.padolsey.com/javascript/wordwrap-for-javascript/
 *
 * The string to be wrapped.
 * The column width (a number, default: 75)
 * The character(s) to be inserted at every break. (default: ‘\n’)
 * The cut: a Boolean value (false by default), if true, the string is always wrapped at or before the specified width.
 *
 */
Provi.Utils.wordwrap = function( str, width, brk, cut ) {
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
    if( !str ){
        return str;
    }
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
    return str.match( RegExp(regex, 'g') ).join( brk );
}


/**
 * http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric/1830844#1830844
 */
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}



/**
 * A class that save items in historical order and provides access to them
 * @constructor
 */
Provi.Utils.HistoryManager = function() {
    this.curr = -1;
    this.entries = [];
}
Provi.Utils.HistoryManager.prototype = /** @lends Provi.Utils.HistoryManager.prototype */ {
    push: function(item) {
        if (this.entries.length && this.entries[0] == item) return;
        if (item.match(/^\s*$/)) return;
        this.entries.unshift(item);
        this.curr = -1;
    },
    scroll: function(direction) {
        var moveTo = this.curr + (direction == 'prev' ? 1 : -1);
        if (moveTo >= 0 && moveTo < this.entries.length) {
            this.curr = moveTo;
            return this.entries[this.curr];
        } else if (moveTo == -1) {
            this.curr = moveTo;
            return '';
        } else {
            return null;
        }
    }
};



})();