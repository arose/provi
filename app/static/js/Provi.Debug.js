/**
 * @fileOverview This file contains the {@link Provi.Debug} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */



/**
 * @namespace
 * Debug module
 */
Provi.Debug = {};


(function() {


// make sure a console object exsists
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

Provi.Debug._console_bak = window.console;

Provi.Debug._logging_func = ['log', 'debug', 'info', 'warn', 'error'];
Provi.Debug._other_func = ['stack_trace'];


//// losses the line number of the original log call
//Provi.Debug.log = function(){
//    window.console.log.apply( window.console, arguments );
//}

//// does not work in webkit browsers: "TypeError: Type Error"
//if( window.console && window.console.log ){
//    Provi.Debug.log = window.console.log;
//}

Provi.Debug._init = function(){
    
    //// wraps http://github.com/cowboy/javascript-debug
    //// losses the line number of the original log call
    //$.each( Provi.Debug._logging_func, function(i, f){
    //    if( window.debug && window.debug[f] ){
    //        Provi.Debug[f] = window.debug[f];
    //    }else{
    //        Provi.Debug[f] = function(){};
    //    }
    //});
    
    // wraps http://github.com/emwendelin/javascript-stacktrace
    Provi.Debug.stack_trace = window.printStackTrace || function(){};
}


/**
 * Turn the debug modus off
 */
Provi.Debug.off = function(){
    //$.each( [].concat( Provi.Debug._logging_func, Provi.Debug._other_func ), function(i, f){
    //    Provi.Debug[f] = function(){};
    //});
    
    $.each( [].concat( Provi.Debug._logging_func ), function(i, f){
        window.console[f] = function(){};
    });
    
    $.each( [].concat( Provi.Debug._other_func ), function(i, f){
        Provi.Debug[f] = function(){};
    });
    
    //window.console = function(){};
    Provi.Debug._status = false;
}


/**
 * Turn the debug modus on
 */
Provi.Debug.on = function(){
    Provi.Debug._init();
    $.each( [].concat( Provi.Debug._logging_func ), function(i, f){
        window.console[f] = Provi.Debug._console_bak[f];
    });
    //window.console = Provi.Debug._console_bak;
    Provi.Debug._status = true;
    
    console.log( 'Browser: ', $.browser );
    console.log( 'navigator.userAgent: ', navigator.userAgent );
    console.log( 'Provi session: ', $.cookie('provisessionX') );
}


/**
 * Set the debug modus depending on weather the GET variable debug is <tt>true</tt> or <tt>false</tt>.
 */
Provi.Debug.auto = function(){
    if( $.query.get('debug') ){
        Provi.Debug.on();
    }else{
        Provi.Debug.off();
    }
}


/**
 * Get the current debug status, 0 if debugging is of and 1 if its on.
 * @returns {boolean} The current status.
 */
Provi.Debug.get_status = function(){
    return Provi.Debug._status;
}


Provi.Debug.timer_count = 0;
Provi.Debug.timer = function( params ){
    this.id = Provi.Debug.timer_count;
    Provi.Debug.timer_count += 1;
    this.name = params.name || 'anon';
    this.name += ' [' + this.id + ']';
    this.start_time = 0;
    this.stop_time = 0;
}
Provi.Debug.timer.prototype = /** @lends Provi.Debug.timer.prototype */ {
    start: function(){
        this.start_time = new Date();
        console.log( 'Timer "' + this.name + '" started' );
    },
    stop: function(){
        this.stop_time = new Date();
        this.duration = this.stop_time - this.start_time;
        console.log(
            'Timer "' + this.name + '" stoped. ' +
            'Duration: ' + this.duration + ' ms.'
        );
    }
}


})();