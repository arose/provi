/**
 * @fileOverview This file contains the {@link Provi.Selection} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi selection module
 */
Provi.Selection = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


/**
 * Fired when something is selected and needs to be propagated.
 *
 * @name Provi.Selection.SelectionManager#select
 * @event
 * @param {object} event A jQuery event object.
 * @param {array} selection_array An array containg the selected atoms.
 * @param {Provi.Jmol.Applet} applet The bound Jmol applet.
 * @param {string} selection The Jmol selection command.
 * @param {Provi.Bio.Smcra.Collection} smcra An Smcra collection containing the selected entities.
 */


/**
 * selection class
 * @constructor
 */
Provi.Selection.Selection = function(params){
    console.log(params.selection);
    this.selection = params.selection;
    this.selection_array;
    this.selection_smcra;
    this.name = params.name;
    this.applet = params.applet;
    if( params.persist ){
	this.id = this.applet.selection_manager.add( this );
	//this.persist();
    }
};
Provi.Selection.Selection.prototype = /** @lends Provi.Selection.Selection.prototype */ {
    /**
     * Triggers the {@link Provi.Selection.SelectionManager#event:select} event.
     */
    _select: function( selection ) {
	console.log( 'select', selection );
	//$.each( Utils.event._keys, function(){ console.log( this + ': ' + Utils.event[ this + 'Key' ] ); });
	this.selection = selection;
	this.selection_array = this._eval( selection );
	this.selection_smcra = this.applet.get_smcra( selection );
        $(this.applet.selection_manager).triggerHandler('select', [ this.selection_array, this.applet, this.selection, this.selection_smcra ]);
    },
    select: function() {
	//console.log( 'select', this.selection );
	Utils.event.metaKey ? this.add() : this._select( this.selection );
	//this._select( this.selection );
    },
    deselect: function() {
	selection = 'selected and not ( ' + this.selection + ' )';
	//console.log( 'deselect', selection );
	this._select( selection );
    },
    add: function() {
	selection = 'selected or ( ' + this.selection + ' )';
	//console.log( 'add selection', selection );
	this._select( selection );
    },
    _eval: function( selection ){
	this.applet.script_wait('show SELECTED;'); // needed, otherwise 'evaluate' sometimes chokes on the 'selected' variable
        var format = '\'%[atomno]\',%[resno],\'%[chain]\',\'%[model]\',\'%[file]\'';
	var sele = this.applet.atoms_property_map( format, selection );
	
	sele = $.map( sele, function(e, i){
	    var model_file = e[3].split('.');
	    if (model_file.length >= 2){
		var model = model_file[1];
		var file = model_file[0];
	    }else{
		var model = model_file[0];
		var file = "1";
	    }
	    return { atomno: e[0], resno: e[1], chain: e[2], model: model, file: file }
	});
        return eval( sele );
    },
    persist: function(){
	this.applet.script_wait( 'select {' + this.selection + '}; save selection sele_' + this.id + ';', true );
    }
};


/**
 * Fired when a selection is added to the selection manager.
 *
 * @name Provi.Selection.SelectionManager#add
 * @event
 * @param {object} event A jQuery event object.
 * @param {Provi.Selection.Selection} selection The added selection object.
 */


/**
 * A class to provide a central instance for selecting atoms, residues, ...
 * @constructor
 */
Provi.Selection.SelectionManager = function(params) {
    this.applet = params.applet;
}
Provi.Selection.SelectionManager.prototype = /** @lends Provi.Selection.SelectionManager.prototype */ {
    _selection_dict: {},
    _selection_list: [],
    _selection_counter: 0,
    add: function(selection){
	console.log('add selection: ', selection);
        this._selection_counter += 1;
        var self = this;
        this._selection_dict[this._selection_counter] = selection;
        this._selection_list.push(selection);
	$(this).triggerHandler('add', [selection]);
        return this._selection_counter;
    },
    get_list: function(){
        return this._selection_list;
    },
    get: function( id ){
        return this._selection_dict[ id ];
    },
    select: function( selection, persist ){
	var sele = new Provi.Selection.Selection({ selection: selection, applet: this.applet, persist: persist });
	sele.select();
    },
    sync: function(){
	this.select('selected');
    }
};


/**
 * widget class for managing a single selection
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Selection.SelectionWidget = function(params){
    this.selection = params.selection;
    Widget.call( this, params );
    this.select_id = this.id + '_select';
    this.info_id = this.id + '_info';
    var content = '<div  class="control_group">' +
        '<div>' +
	    this.selection.id + ': ' + this.selection.name + '&nbsp;' +
	    '<button id="' + this.select_id + '">select</button>' +
	'</div>' +
    '</div>'
    $(this.dom).append( content );
    
    this.init();
}
Provi.Selection.SelectionWidget.prototype = Utils.extend(Widget, /** @lends Provi.Selection.SelectionWidget.prototype */ {
    init: function(){
	console.log('init selectionWidget');
        var self = this;
	$("#" + this.select_id).button().click(function() {
	    self.selection.select();
	});
    }
});



/**
 * widget class for managing selections
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Selection.SelectionManagerWidget = function(params){
    this._widget_list = [];
    this.selection_manager = params.selection_manager;
    this.persist_on_applet_delete = params.persist_on_applet_delete = true;
    this.applet = params.applet;
    Widget.call( this, params );
    this.list_id = this.id + '_list';
    var content = '<div>' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.init();
}
Provi.Selection.SelectionManagerWidget.prototype = Utils.extend(Widget, /** @lends Provi.Selection.SelectionManagerWidget.prototype */ {
    init: function(){
        $("#" + this.list_id).empty();
        var self = this;
        $.each( this.selection_manager.get_list(), function(){
            self.add( this );
        });
	$(this.selection_manager).bind('add', function(event, selection){
	    self.add( selection );
	});
	$(this.applet).bind('load_struct', function(event, fullPathName, fileName, modelName, ptLoad, previousCurrentModelNumberDotted, lastLoadedModelNumberDotted){
	    if(lastLoadedModelNumberDotted){
		new Provi.Selection.Selection({
		    persist: true,
		    applet: self.applet,
		    name: 'Protein ' + lastLoadedModelNumberDotted,
		    selection: lastLoadedModelNumberDotted
		});
	    }
	});
    },
    add: function(selection){
	this._widget_list.push( new Provi.Selection.SelectionWidget({
	    parent_id: this.list_id,
	    selection: selection
	}));
    }
});



})();