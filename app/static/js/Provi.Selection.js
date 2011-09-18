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
    set_id: function(id){
	this.id = id;
    },
    /**
     * Triggers the {@link Provi.Selection.SelectionManager#event:select} event.
     */
    _select: function( selection ) {
	//console.log( 'select', selection );
	//$.each( Utils.event._keys, function(){ console.log( this + ': ' + Utils.event[ this + 'Key' ] ); });
	this.selection = selection;
	this.selection_array = this._eval( selection );
	this.selection_smcra = this.applet.get_smcra( selection );
        $(this.applet.selection_manager).triggerHandler('select', [ this.selection_array, this.applet, this.selection, this.selection_smcra ]);
    },
    select: function() {
	//console.log( 'select', this.selection );
	Utils.event.ctrlKey ? this.add() : this._select( this.selection );
	//this._select( this.selection );
    },
    deselect: function() {
	if(!this.selection) return;
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
	if(sele == 'ERROR') return false;
	//console.log(sele);
	sele = $.map( sele, function(e, i){
	    if(!e) return {};
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
 * Fired when there is a change regarding selections.
 *
 * @name Provi.Selection.SelectionManager#change
 * @event
 * @param {object} event A jQuery event object.
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
        this._selection_counter += 1;
	selection.set_id( this._selection_counter );
        var self = this;
        this._selection_dict[this._selection_counter] = selection;
        this._selection_list.push(selection);
	$(this).triggerHandler('add', [selection]);
	$(this).triggerHandler('change');
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
    deselect: function( selection, persist ){
	var sele = new Provi.Selection.Selection({ selection: selection, applet: this.applet, persist: persist });
	sele.deselect();
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
    this._build_element_ids([ 'select', 'show', 'hide']);
    var content = '<div  class="control_group" style="margin:0;">' +
        '<div>' +
	    this.selection.id + ': ' + this.selection.name + '&nbsp;' +
	    '<div style="float:right;">' +
		'<button id="' + this.select_id + '">select</button>' +
		'<button id="' + this.show_id + '">show</button>' +
		'<button id="' + this.hide_id + '">hide</button>' +
	    '</div>' +
	'</div>' +
    '</div>'
    $(this.dom).append( content );
    
    this.init();
}
Provi.Selection.SelectionWidget.prototype = Utils.extend(Widget, /** @lends Provi.Selection.SelectionWidget.prototype */ {
    init: function(){
        var self = this;
	$("#" + this.select_id).button().click(function() {
	    self.selection.select();
	});
	$("#" + this.show_id).button().click(function() {
	    self.selection.applet.script_wait( 'display displayed or (' + self.selection.selection + ');' );
	});
	$("#" + this.hide_id).button().click(function() {
	    self.selection.applet.script_wait( 'hide hidden or (' + self.selection.selection + ');' );
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
    this._build_element_ids([ 'list', 'selection_creator' ]);
    var content = '<div class="control_group">' +
	'<div id="' + this.selection_creator_id + '"></div>' +
        '<div id="' + this.list_id + '"></div>' +
    '</div>';
    $(this.dom).append( content );
    this.selection_creator = new Provi.Selection.CreatorWidget({
        parent_id: this.selection_creator_id,
	applet: this.applet,
	selection_manager: this.selection_manager
    });
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


/**
 * widget class for selecting selections
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Selection.SelectorWidget = function(params){
    this._widget_list = [];
    this.selection_manager = params.selection_manager;
    this.persist_on_applet_delete = params.persist_on_applet_delete = true;
    this.applet = params.applet;
    Widget.call( this, params );
    this._build_element_ids([ 'selector', 'selection' ]);
    var content = '<span>' +
	'<label for="' + this.selector_id + '">Selection:</label>&nbsp;' +
        '<select id="' + this.selector_id + '" class="ui-state-default"></select>' +
	'<input id="' + this.selection_id + '" type="text"/>' +
    '</span>';
    $(this.dom).append( content );
    this.init();
}
Provi.Selection.SelectorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Selection.SelectorWidget.prototype */ {
    init: function(){
        $("#" + this.list_id).empty();
        var self = this;
	if( this.applet ){
	    this.set_applet( this.applet );
	}else{
	    this._update();
	}
    },
    _update: function(){
	var elm = $("#" + this.selector_id);
        var value = $("#" + this.selector_id + " option:selected").val();
	elm.empty();
	if( this.selection_manager ){
	    elm.append("<option value=''></option>");
	    $.each(this.selection_manager.get_list(), function(){
		elm.append("<option value='" + this.id + "'>" + this.name + ' (' + this.id + ')' + "</option>");
	    });
	    elm.val( value );
	}
    },
    get: function(selection){
	var id = $("#" + this.selector_id + " option:selected").val();
	var sele = $("#" + this.selection_id).val();
	if( sele ){
	    return new Provi.Selection.Selection({ applet: this.applet, selection: sele });
	}else if( id ){
	    return this.selection_manager.get( id );
	}else{
	    return new Provi.Selection.Selection({ applet: this.applet, selection: '' });
	}
    },
    set_applet: function(applet){
	var self = this;
	this.applet = applet;
	if( applet ){
	    this.selection_manager = applet.selection_manager;
	    $( this.selection_manager ).bind('change change_selected', function(){
		self._update();
	    });
	}
	this._update();
    }
});


/**
 * widget class for creating selections
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Selection.CreatorWidget = function(params){
    this._widget_list = [];
    this.selection_manager = params.selection_manager;
    this.persist_on_applet_delete = params.persist_on_applet_delete = true;
    this.applet = params.applet;
    Widget.call( this, params );
    this._build_element_ids([ 'name', 'selection', 'construct' ]);
    var content = '<div>' +
	'<div class="control_row">' +
	    '<label for="' + this.name_id + '">Name:</label>' +
	    '<input id="' + this.name_id + '" type="text"/>' +
	'</div>' +
	'<div class="control_row">' +
	    '<label for="' + this.selection_id + '">Selection:</label>' +
	    '<input id="' + this.selection_id + '" type="text"/>' +
	'</div>' +
	'<div class="control_row">' +
	    '<button id="' + this.construct_id + '">construct</button>' +
	'</div>' + 
    '</div>';
    $(this.dom).append( content );
    this.init();
}
Provi.Selection.CreatorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Selection.CreatorWidget.prototype */ {
    init: function(){
        var self = this;
	$("#" + this.construct_id).button().click( function(){
	    new Provi.Selection.Selection({
		persist: true,
		applet: self.applet,
		name: $("#" + self.name_id).val(),
		selection: $("#" + self.selection_id).val()
	    });
	});
    }
});


})();