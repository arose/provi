/**
    A function for the Array object to reduce an array to unique elements
    @function
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


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


Array.prototype.removeItems = function(itemsToRemove) {

    if (!/Array/.test(itemsToRemove.constructor)) {
        itemsToRemove = [ itemsToRemove ];
    }

    var j;
    for (var i = 0; i < itemsToRemove.length; i++) {
        j = 0;
        while (j < this.length) {
            if (this[j] == itemsToRemove[i]) {
                this.splice(j, 1);
            } else {
                j++;
            }
        }
    }
}
