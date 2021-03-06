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

Provi.Debug._logging_func = ['log', 'debug', 'info', 'warn', 'error'];


// make sure a console object exsists
if(typeof window.console === "undefined") {
    /**
     * fake window.console to catch forgotten debug statements
     * in a non debug environment
     * @ignore
    */
    window.console = {};
    _.each( Provi.Debug._logging_func, function(f){
        window.console[f] = function(){};
    });
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

// does this work?
Provi.Debug._console_bak = _.clone( window.console );



/**
 * Turn the debug modus off
 */
Provi.Debug.off = function(){
    _.each( Provi.Debug._logging_func, function(f){
        window.console[f] = function(){};
    });

    $.ajaxSetup({
        error: function(){}
    });
    
    Provi.Debug._status = false;
}


/**
 * Turn the debug modus on
 */
Provi.Debug.on = function(){
    _.each( Provi.Debug._logging_func, function(f){
        window.console[f] = Provi.Debug._console_bak[f];
    });

    $.ajaxSetup({
        error: function(e){ console.error(e); }
    });

    Provi.Debug._status = true;
    
    console.log( 'Browser: ', $.browser );
    console.log( 'navigator.userAgent: ', navigator.userAgent );
    console.log( 'Provi session: ', $.cookie('provisessionX') );
}


/**
 * Set the debug modus depending on weather the config variable debug is <tt>true</tt> or <tt>false</tt>.
 */
Provi.Debug.auto = function(){
    if( Provi.config.debug ){
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
    start: function(msg){
        this.start_time = new Date();
        console.log( 'Timer "' + this.name + '" started. [' + msg + ']' );
    },
    stop: function(msg){
        this.stop_time = new Date();
        this.duration = this.stop_time - this.start_time;
        console.log(
            'Timer "' + this.name + '" stoped. ' +
            'Duration: ' + this.duration + ' ms. [' + msg + ']'
        );
    }
}


})();