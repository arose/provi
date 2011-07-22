/**
 * @fileOverview This file contains the {@link Provi.Utils} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */




/*
 * jsTree checkbox plugin
 * Inserts checkboxes in front of every node
 * Depends on the ui plugin
 * DOES NOT WORK NICELY WITH MULTITREE DRAG'N'DROP
 */
(function ($) {
    $.jstree.plugin("checkbox_grid", {
        __init : function () {

            this.get_container()
                .bind("open_node.jstree create_node.jstree clean_node.jstree refresh.jstree", $.proxy(function (e, data) { 
                    this._prepare_checkboxes(data.rslt.obj);
                }, this))
                .bind("loaded.jstree", $.proxy(function (e) {
                    this._prepare_checkboxes();
                }, this))
                .delegate( "ins.jstree-checkbox" , "click.jstree", $.proxy(function (e) {
                    e.preventDefault();
                    var column = $(e.target).index() + 1;
                    console.log('CHECKBOX GRID CLICK', e, e.target, column);
                    if( $(e.target).hasClass("jstree-checked") ) {
                        this.uncheck_node(e.target, column);
                    }else{
                        this.check_node(e.target, column);
                    }
                }, this));
        },
        defaults : {
            columns: 1,
            checked_parent_open : true
        },
        __destroy : function () {
            this.get_container()
                .find("ins.jstree-checkbox").remove();
        },
        _fn : {
            //???
            _checkbox_notify : function (n, data) {
                if(data.checked) {
                    this.check_node(n, false);
                }
            },
            _prepare_checkboxes : function (obj) {
                obj = !obj || obj == -1 ? this.get_container().find("> ul > li") : this._get_node(obj);
                if(obj === false) { return; } // added for removing root nodes
                var checkbox_grid,
                    _this = this,
                    columns = this._get_settings().checkbox_grid.columns;
                
                checkbox = {};
                checkbox_grid = "<span class='jstree-checkbox-grid'>";
                for(var col = 1; col <= columns; ++col){
                    checkbox[col] = obj.children("a").children("span.jstree-checkbox-grid").children("ins:nth-child(" + col + ")");
                    checkbox_grid += "<ins class='jstree-checkbox'>&#160;</ins>";
                }
                checkbox_grid += "</span>";
                
                
                
                obj.each(function () {
                    $(this).find("li").andSelf().each(function () {
                        var $t = $(this);
                        var $added = $t.children( "a:eq(0)" )
                            .not(":has(span.jstree-checkbox-grid)")
                            .prepend( checkbox_grid ).parent();
                        for(var col = 1; col <= columns; ++col){
                            
                            $added.children("a").children("span.jstree-checkbox-grid").children("ins:nth-child(" + col + ")")
                                .addClass( checkbox[col].hasClass("jstree-checked") ? "jstree-checked" : "jstree-unchecked" );
                        }
                    });
                });
                if(obj.length === 1 && obj.is("li")) {
                    this._repair_state(obj);
                }else if(obj.is("li")) {
                    obj.each(function () {
                        _this._repair_state(this);
                    });
                }else{
                    obj.find("> ul > li").each(function () {
                        _this._repair_state(this);
                    });
                }
                // if a child is checked, repair from this parent on
                if(false){
                    obj.parent().parent().each(function () {
                        _this._repair_state(this);
                    });
                }
		//obj.find("li").parent().parent().each(function () { _this._repair_state(this); });
            },
            change_state : function (obj, column, state) {
                timer = new Provi.Debug.timer({name:"tree checkbox grid"});
                obj = this._get_node(obj);
                //console.log( 'CHANGE_STATE', obj );
                //
                timer.start('99');
                var checkbox = obj.children("a").children("span.jstree-checkbox-grid").children("ins:nth-child(" + column + ")");
                timer.stop('101');
                //console.log( "CHECKBOX", checkbox );
                
                if(!obj || obj === -1) { return false; }
                state = (state === false || state === true) ? state : checkbox.hasClass("jstree-checked");
                timer.start('106');
                var coll = obj.children("ul").find("li").children("a").children("span.jstree-checkbox-grid")
                    .children("ins:nth-child(" + column + ")").add(checkbox);
                if(state) {
                    //console.log('COLL', coll);
                    if(!coll.filter(".jstree-checked, .jstree-undetermined").length) { return false; }
                    coll.removeClass("jstree-checked jstree-undetermined").addClass("jstree-unchecked"); 
                }else{ 
                    //console.log('COLL', coll);
                    if(!coll.filter(".jstree-unchecked, .jstree-undetermined").length) { return false; }
                    coll.removeClass("jstree-unchecked jstree-undetermined").addClass("jstree-checked"); 
                }
                timer.stop('118');
                
                obj.parentsUntil(".jstree", "li").each(function () {
                    var $this = $(this);

                    if(state) {
                        timer.start('132');
                        var checked_parents = $this.children("ul").children("li").children("a")
                        //var checked_parents = $this.children("> ul li a")
                            .children("span.jstree-checkbox-grid")
                            .children("ins:nth-child(" + column + ").jstree-checked, " +
                                  "ins:nth-child(" + column + ").jstree-undetermined");
                        timer.stop('138');
                        
                        if( checked_parents.length) {
                            timer.start('141');
                            $this.parentsUntil(".jstree", "li").children("a")
                                .children("span.jstree-checkbox-grid")
                                .children("ins:nth-child(" + column + ")")
                                .add( $this.children("a").find("span.jstree-checkbox-grid ins:nth-child(" + column + ")") )
                                .removeClass("jstree-checked jstree-unchecked")
                                .addClass("jstree-undetermined");
                            timer.stop('148')
                            return false;
                        }else{
                            timer.start('151');
                            $this.children("a").children("span.jstree-checkbox-grid")
                                .children("ins:nth-child(" + column + ")")
                                .removeClass("jstree-checked jstree-undetermined").addClass("jstree-unchecked");
                            timer.stop('155');
                        }
                    }else{
                        timer.start('158');
                        var unchecked_parents = $this.children("ul").children("li").children("a")
                            .children("span.jstree-checkbox-grid")
                            .children("ins:nth-child(" + column + ").jstree-unchecked, " +
                                  "ins:nth-child(" + column + ").jstree-undetermined");
                        timer.stop('163');
                        if( unchecked_parents.length) {
                            timer.start('165');
                            $this.parentsUntil(".jstree", "li").children("a")
                                .children("span.jstree-checkbox-grid ")
                                .children("ins:nth-child(" + column + ")")
                                .add( $this.children("a").find("span.jstree-checkbox-grid ins:nth-child(" + column + ")") )
                                .removeClass("jstree-checked jstree-unchecked")
                                .addClass("jstree-undetermined");
                            timer.stop('172');
                            return false;
                        }else{
                            timer.start('175');
                            $this.children("a").children("span.jstree-checkbox-grid")
                                .children("ins:nth-child(" + column + ")")
                                .removeClass("jstree-unchecked jstree-undetermined").addClass("jstree-checked");
                            timer.stop('178');
                        }
                    }
                    return true;
                });
                this.__callback(obj);
                return true;
            },
            check_node : function (obj, column) {
                if(this.change_state(obj, column, false)) { 
                    obj = this._get_node(obj);
                    if(this._get_settings().checkbox_grid.checked_parent_open) {
                        var t = this;
                        obj.parents(".jstree-closed").each(function () { t.open_node(this, false, true); });
                    }
                    this.__callback({ "obj" : obj }); 
                }
            },
            uncheck_node : function (obj, column) {
                if(this.change_state(obj, column, true)) { this.__callback({ "obj" : this._get_node(obj) }); }
            },
                check_all : function () {
                        var _this = this, 
                                coll = this._get_settings().checkbox.two_state ? this.get_container_ul().find("li") : this.get_container_ul().children("li");
                        coll.each(function () {
                                _this.change_state(this, false);
                        });
                        this.__callback();
                },
            uncheck_all : function (column) {
                //console.log('uncheck_all');
                var _this = this;
                this.get_container_ul().children("li").each(function () {
                    _this.change_state(this, column, true);
                });
                this.__callback();
            },

                is_checked : function(obj) {
                        obj = this._get_node(obj);
                        return obj.length ? obj.is(".jstree-checked") : false;
                },
            get_checked : function (obj, column, all) {
                console.log(column);
                obj = !obj || obj === -1 ? this.get_container() : this._get_node(obj);
                //console.log(obj);
                if( all ){
                    return obj.find( "li span ins:nth-child(" + column + ").jstree-checked" ).parent().parent().parent();
                }else{
                    var undetermined = obj.find( "ins:nth-child(" + column + ").jstree-undetermined" ).parent().parent().parent();
                    return obj.add( undetermined )
                        .find( "> ul > li > a > span ins:nth-child(" + column + ").jstree-checked" )
                        .parent().parent().parent();
                }
            },
                get_unchecked : function (obj, get_all) { 
                        obj = !obj || obj === -1 ? this.get_container() : this._get_node(obj);
                        return get_all || this._get_settings().checkbox.two_state ? obj.find(".jstree-unchecked") : obj.find("> ul > .jstree-unchecked, .jstree-undetermined > ul > .jstree-unchecked");
                },
                show_checkboxes : function () {
                    this.get_container().children("ul").removeClass("jstree-no-checkboxes");
                },
                hide_checkboxes : function () {
                    this.get_container().children("ul").addClass("jstree-no-checkboxes");
                },
                _repair_state : function (obj) {
                    // not needed until added nodes bring an initial state, or is it?
                    return;
                    obj = this._get_node(obj);
                    if(!obj.length) { return; }
                    //var a = obj.find("> ul > .jstree-checked").length,
                    //    b = obj.find("> ul > .jstree-undetermined").length,
                    //    c = obj.find("> ul > li").length;
                        
                    var a, b, c, checkbox;
                    var columns = this._get_settings().checkbox_grid.columns;
                    console.log(obj);
                    for( var col = 1; col <= columns; ++col ){
                        console.log(col, columns);
                        a = obj.children("ul").children("li").children("span.jstree-checkbox-grid")
                            .children(":nth-child(" + col + ").jstree-checked").length;
                        b = obj.children("ul").children("li").children("span.jstree-checkbox-grid")
                            .children(":nth-child(" + col + ").jstree-undetermined").length;
                        c = obj.children("ul").children("li").length;
                        console.log("abc", a,b,c);
                        if(c === 0) {
                            checkbox = obj.children("a").children("span.jstree-checkbox-grid").children(":nth-child(" + col + ")");
                            if(checkbox.hasClass("jstree-undetermined")) {
                                this.change_state(obj, col, false);
                            }
                        }else if(a === 0 && b === 0){
                            this.change_state(obj, col, true);
                        }else if(a === c){
                            this.change_state(obj, col, false);
                        }else{ 
                            //obj.parentsUntil(".jstree","li").andSelf().removeClass("jstree-checked jstree-unchecked").addClass("jstree-undetermined");
                            obj.parentsUntil(".jstree", "li").children("a")
                                .children("span.jstree-checkbox-grid")
                                .children(":nth-child(" + column + ")")
                                .add( obj.children("a").find("span.jstree-checkbox-grid :nth-child(" + col + ")") )
                                .removeClass("jstree-checked jstree-unchecked")
                                .addClass("jstree-undetermined");
                        }
                    }
                },
                reselect : function () {
                    this.__call_old(); 
                },
                save_loaded : function () {
                    var _this = this;
                    this.data.core.to_load = [];
                    this.get_container_ul().find("li.jstree-closed.jstree-undetermined").each(function () {
                            if(this.id) { _this.data.core.to_load.push("#" + this.id); }
                    });
                }
        }
    });
    $(function() {
            var css_string = '.jstree .jstree-real-checkbox { display:none; } ';
            $.vakata.css.add_sheet({ str : css_string, title : "jstree" });
    });
})(jQuery);
//*/



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


if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
        res[i] = fun.call(thisp, t[i], i, t);
    }

    return res;
  };
}


if(!Object.keys){
    Object.keys = function(o){
        if (o !== Object(o)){
            throw new TypeError('Object.keys called on non-object');
        }
        var ret=[],p;
        for(p in o){
            if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
        }
        return ret;
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
 * http://zeeohemgee.blogspot.com/2006/07/comparing-and-copying-arrays-in.html
 */
//Check if two arrays' contents are the same
//returns true if they are, otherwise false
Provi.Utils.array_cmp = function(a,b)
{
  //Check if the arrays are undefined/null
  if(!a || !b)
    return false;

  //first compare their lengths
  if(a.length == b.length)
  {
    //go thru all the vars
    for(var i = 0; i < a.length;i++)
    {
      //if the var is an array, we need to make a recursive check
      //otherwise we'll just compare the values
      if(typeof a[i] == 'object') {
        if(!Provi.Utils.array_cmp(a[i],b[i]))
          return false;
      }
      else if(a[i] != b[i])
        return false;
    }
    return true;
  }
  else return false;
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