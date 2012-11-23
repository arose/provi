/*
 * svgfix.js - Javascript SVG parser and renderer on Canvas
 * version: 0.2
 * MIT Licensed
 * 
 * Fixes svg graphics:
 * - Adds xmlns:xlink 
 * - xlink:href instad of href
 * - trim 
 * 
 * To be used before calls to canvg.js
 *  
 * Ignacio Vazquez (ivazquez@adooxen.com)
 * Requires JQuery
 * http://phpepe.com/
 */
(function(){
	this.svgfix = function (text) {
		var fixed = text ;
		fixed = jQuery.trim(fixed);
		if (fixed.indexOf( 'xmlns:xlink' ) == -1 ) {
			fixed = fixed.replace ('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" '); 
		}
		//fixed = fixed.replace (' href', ' xlink:href'); 
		fixed = fixed.replace(/\shref/g,' xlink:href');
		return fixed; 
	}
})();