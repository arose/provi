/**
 * @fileOverview This file contains the {@link Provi.Bio.AtomSelection} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * atom selection module
 */
Provi.Bio.AtomSelection = {};


(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;


var AtomProperty = {};


/**
 * @class Represents atom selection
 */
Provi.Bio.AtomSelection.AtomSelection = function( params ){
    var p = [ "dataset", "applet" ];
    _.extend( this, _.pick( params, p ) );
    this.load();
};
Provi.Bio.AtomSelection.AtomSelection.prototype = {
    load: function(){
        var s = 'provi_load_selection("' + this.dataset.url + '", "' + this.dataset.id + '");';
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    },
    get_list: function(){
        return this.applet.evaluate( "provi_datasets[" + this.dataset.id + "].join(',')" ).split(",");
    }
};



var jmol_properties = [
    "", "vdwRadius", "volume", "temperature", "charge", "formalCharge", "partialCharge",
    "phi", "psi"
]



Provi.Bio.AtomSelection.SelectionDatalist = function(params){
    var p = [ "sele", "filter", "sort", "property" ];
    _.extend( this, _.pick( params, p ) );

    Provi.Data.Datalist.call( this, params );

    this.handler = _.defaults({
        "select": {
            "selector": 'input[cell="selected"]',
            "click": this.select,
            "label": function(selected, id){
                return (selected ? 'Deselect' : 'Select') + (id==='all' ? ' all' : '');
            }
        },
        "display": {
            "selector": 'input[cell="displayed"]',
            "click": this.display,
            "label": function(displayed, id){
                return (displayed ? 'Hide' : 'Display') + (id==='all' ? ' all' : '');
            }
        },
        "highlight": {
            "selector": 'span[cell="label"]',
            "click": this.highlight,
            "label": function(displayed, id){
                return "Highlight";
            }
        }
    }, this.handler);
}
Provi.Bio.AtomSelection.SelectionDatalist.prototype = Utils.extend(Provi.Data.Datalist, {
    type: "SelectionDatalist",
    get_data: function(id){},
    selection: function(id){
        // needs to respect this.sele and this.filter
        // must cope with id==='all'
    },
    filtered: function(){
        if( this.filter ){
            return '(' + this.sele + ') and (' + this.filter + ') and (not symmetry)';
        }else{
            return this.sele + ' and (not symmetry)';
        }
    },
    displayed: function(id){
        var d = '{displayed and ' + this.selection(id) + '}.length.join("")/' +
            '{' + this.selection(id) + '}.length.join("")';
        return this.applet.evaluate(d);
    },
    get_property: function(id){
        if(!this.property) return '';
        var d = '{' + this.selection(id) + '}.' + this.property + '';
        return this.applet.evaluate(d);
    },
    select: function(id, flag, params, callback){
        var selection = this.selection( id );
        var s = 'select ' + (flag ? 'remove' : 'add') + ' ' + selection;
        this.applet.script_callback( s, {}, callback );
    },
    display: function(id, flag, params, callback){
        var selection = this.selection( id );
        var s = 'display ' + (flag ? 'remove' : 'add') + ' ' + selection;
        this.applet.script_callback( s, {}, callback );
    },
    highlight: function(id){
        var s = "provi_highlight({" + this.selection( id ) + "});";
        console.log( "highlight", id, s );
        this.applet.script( s, {} );
    },
    label_cell: function(label, id){
        var $label = $('<span cell="label" style="float:left; width:120px;">' +
            label +
        '</span>').data( 'id', id );
        return $label;
    },
    selected_cell: Provi.Widget.Grid.CellFactory({
        "name": "selected", "position": "left"
    }),
    displayed_cell: Provi.Widget.Grid.CellFactory({
        "name": "displayed", "position": "left"
    }),
    color_cell: function(color){
        if( color ){
            color = color || '';
            color = color.replace(/[\.,]00/g, ' ').trim();
            var c = "0,0,0";
            if( color ){ c = color.split(/\s+/g).join(','); }
            var bg = "background-color:rgb(" + c + ");";
        }else{
            var bg = '';
        }
        var $color = $("<span " +
            "style='float:right; width:30px; " + bg + "'>&nbsp;" +
        "</span>");
        return $color;
    },
    property_cell: function(id, property){
        if(_.isNumber(property) && !_.isNaN(property)){
            property = property.toPrecision(4);
        }else{
            property = '';
        }
        var $property = $("<span style='float:right; width:45px; text-align:center;'>" +
            property +
        "</span>");
        return $property;
    }
});




Provi.Bio.AtomSelection.AtomindexParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.AtomSelection.AtomindexParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        property: { default_value: "", type: "select",  options: jmol_properties },
        sort: { default_value: "", type: "select", options: jmol_properties }
    }
});


Provi.Bio.AtomSelection.AtomindexDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
}
Provi.Bio.AtomSelection.AtomindexDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "AtomindexDatalist",
    params_object: Provi.Bio.AtomSelection.AtomindexParamsWidget,
    get_ids: function(){
        console.log(this.name, "get_ids");
        if( this.sort ){
            var s = 'sort_by_prop( {' + this.filtered() + '}, "' + this.sort + '" ).join(",")';
            var a = this.applet.evaluate(s);
            a = a ? a.split(",") : [];
            return a;
        }else{
            var format = '%[atomIndex]';
            var data = this.applet.atoms_property_map( format, this.filtered() );
            //console.error('get_ids');
            data = _.map(data, function(val){
                return val[0];
            });
            return data;
        }
    },
    get_data: function(id){
        var format = '\'%[group]\',\'%[resno]\',\'%[chain]\',\\"%[atomName]\\",\'%[file]\',\'%[model]\',\'%[selected]\',\'%[color]\'';
        var a = this.applet.atoms_property_map( format, this.selection(id) )[0];
        return a;
    },
    make_row: function(id){
        if(id==='all'){
            var label = 'Atoms';
            var s = '{' + this.selection(id) + '}.selected.join("")';
            var selected = this.applet.evaluate(s);
            var color = '';
        }else{
            var a = this.get_data(id) || [];
            var label = '[' + a[0] + ']' + a[1] + ':' + a[2] + '.' + a[3] + '/' + a[4] + '.' + a[5];
            var selected = parseFloat(a[6]);
            var color = a[7];
        }

        var $row = $('<div></div>').append(
            this.selected_cell( id, selected ),
            this.displayed_cell( id, this.displayed(id) ),
            this.label_cell( label, id ),
            this.color_cell( color ),
            this.property_cell( id, this.get_property(id) )
        );
        return $row;
    },
    selection: function(id){
        return id==='all' ? this.filtered() : '({' + id + '})';
    }
});




Provi.Bio.AtomSelection.GroupindexParamsWidget = function(params){
    Provi.Widget.ParamsWidget.call( this, params );
}
Provi.Bio.AtomSelection.GroupindexParamsWidget.prototype = Utils.extend(Provi.Widget.ParamsWidget, {
    params_dict: {
        property: { default_value: "", type: "select",  options: jmol_properties }
    }
});


Provi.Bio.AtomSelection.GroupindexDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
}
Provi.Bio.AtomSelection.GroupindexDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "GroupindexDatalist",
    params_object: Provi.Bio.AtomSelection.GroupindexParamsWidget,
    get_ids: function(sele){
        var s = '{' + this.filtered() + '}.groupindex.all.count().join("")';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split('\t');
        data = _.filter(data, function(val, i){
            return i % 2 == 0;
        });
        return data;
    },
    get_data: function(id){
        if(id==="all"){
            var a = [0,0,0,0,0];
        }else{
            var format = '\'%[group]\',\'%[resno]\',\'%[chain]\',\'%[file]\',\'%[model]\'';
            var a = this.applet.atoms_property_map( format, this.selection(id), true )[0] || [0,0,0,0,0];
        }
        var s = '{' + this.selection(id) + '}.selected.join("")';
        var selected = this.applet.evaluate(s);
        a.push( selected );
        return a;
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Groups";
        }else{
            var label = '[' + a[0] + ']' + a[1] + ':' + a[2] + '/' + a[3] + '.' + a[4];    
        }

        var $row = $('<div></div>').append(
            this.selected_cell( id, a[5] ),
            this.displayed_cell( id, this.displayed(id) ),
            this.label_cell( label, id ),
            this.property_cell( id, this.get_property(id) )
        );
        return $row;
    },
    selection: function(id){
        if(id==='all'){
            return 'within(GROUP, ' + this.filtered() + ')';
        }else{
            return 'groupindex=' + id;
        }
    }
});


Provi.Bio.AtomSelection.ChainlabelDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
}
Provi.Bio.AtomSelection.ChainlabelDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "ChainlabelDatalist",
    get_ids: function(){
        var s = '' +
            '{' + this.filtered() + '}.file.all' +
                '.add(".", {' + this.filtered() + '}.model.all )' +
                '.add(":", {' + this.filtered() + '}.chain.all )' +
            '.count().join("")' +
        '';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split('\t');
        data = _.filter(data, function(val, i){
            return i % 2 == 0;
        });
        return data;
    },
    get_data: function(id){
        var s = '{' + this.selection(id) + '}.selected.join("")';
        var selected = this.applet.evaluate(s);
        return _.map([ selected ], parseFloat);
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Chains";
        }else{
            var label = this.selection(id);
        }
        
        var $row = $('<div></div>').append(
            this.selected_cell( id, a[0] ),
            this.displayed_cell( id, this.displayed(id) ),
            this.label_cell( label, id )
        );
        return $row;
    },
    selection: function(id){
        if(id==="all"){
            return 'within(CHAIN, ' + this.filtered() + ')';
        }else{
            var m = id.match( /(.*)\.(.*):(.*)/ );
            return ':' + m[3] + '/' + m[1] + '.' + m[2];
        }
    }
});


Provi.Bio.AtomSelection.ModelindexDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
}
Provi.Bio.AtomSelection.ModelindexDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "ModelindexDatalist",
    get_ids: function(){
        var s = '{' + this.filtered() + '}.modelindex.all.count().join("")';
        var data = this.applet.evaluate(s);
        console.log(this.name, s, data);
        if(data) data = data.trim().split('\t');
        data = _.filter(data, function(val, i){
            return i % 2 == 0;
        });
        return data;
    },
    get_data: function(id){
        var format = '\'%[model]\',\'%[modelindex]\'';
        var a = this.applet.atoms_property_map( format, this.selection(id), true )[0];
        var s = '{' + this.selection(id) + '}.selected.join("")';
        var selected = parseFloat( this.applet.evaluate(s) );
        a.push( selected );
        return a;
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Models";
        }else{
            // var label = '/' + a[0] + '.' + a[1];
            var label = '/' + ( a[0]=="0" ? parseInt(a[1])+1 : a[0] );
        }

        var $row = $('<div></div>').append(
            this.selected_cell( id, a[2] ),
            this.displayed_cell( id, this.displayed(id) ),
            this.label_cell( label, id )
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, ' + this.filtered() + ')';
        }else{
            return 'modelindex=' + id;
        }
    }
});


Provi.Bio.AtomSelection.VariableDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
}
Provi.Bio.AtomSelection.VariableDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "VariableDatalist",
    get_ids: function(){
        // TODO respect this.filter by checking if there is
        // at least one atom in a selection that is also in this.filter
        var s = 'provi_selection.keys.join(",")';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split(',');
        return data;
    },
    get_data: function(id){
        var ids = (id=="all") ? this.get_ids() : [id];
        var s = 'provi_sele_test( ["' + ids.join('","') + '"] ).join(",")';
        var a = this.applet.evaluate(s).split(",");
        var selected = parseFloat(a[0]);
        return [ selected ];
    },
    make_row: function(id){
        var a = this.get_data(id);
        var label = (id==="all") ? 'Selections' : id;

        $row = $('<div></div>').append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label, id )
        );
        return $row;
    },
    selection: function(id, flag){
        var ids = (id==='all') ? this.get_ids() : [ id ];
        var sele = _.map( ids, function(id){
            return 'provi_selection["' + id + '"]';
        });
        if(flag){
            var ret = sele.join(' OR '); 
        }else{
            var ret = '@{ ' + sele.join(' } OR @{ ') + ' }';
        }
        if(id==='all' && this.filter){
            ret = '(' + ret + ') AND (' + this.filter + ')';
        }
        return ret;
    },
    highlight: function(id){
        var s = "provi_highlight(" + this.selection( id, true ) + ");";
        console.log( "highlight", id, s );
        this.applet.script( s, {} );
    }
});


Provi.Bio.AtomSelection.StrucnoDatalist = function(params){
    Provi.Bio.AtomSelection.SelectionDatalist.call( this, params );
}
Provi.Bio.AtomSelection.StrucnoDatalist.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionDatalist, {
    type: "StrucnoDatalist",
    get_ids: function(){
        var s = '{' + this.filtered() + '}.modelindex.all' +
            '.add("/", {' + this.filtered() + '}.strucno.all )' +
            '.count().join("")';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split('\t');
        data = _.filter(data, function(val, i){
            return i % 2 == 0;
        });
        return data;
    },
    get_data: function(id){
        var format = '\'%[structure]\',\'%[substructure]\',\'%[model]\',\'%[modelindex]\'';
        var a = this.applet.atoms_property_map( format, this.selection(id), true )[0];
        var s = '{' + this.selection(id) + '}.selected.join("")';
        // todo: get number of substructures of the same type with a smaller strucno
        var selected = parseFloat( this.applet.evaluate(s) );
        a.push( selected );
        return a;
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Strucno";
        }else{
            console.log(a);
            var label = a[0] + ' | ' + a[1] + ' /' + ( a[2]=="0" ? parseInt(a[3])+1 : a[2] );
        }

        var $row = $('<div></div>').append(
            this.selected_cell( id, a[4] ),
            this.displayed_cell( id, this.displayed(id) ),
            this.label_cell( label, id )
        );
        return $row;
    },
    selection: function(id){
        if( id==='all' ){
            return 'within(MODEL, ' + this.filtered() + ')';
        }else{
            var m = id.match( /(.*)\/(.*)/ );
            return 'strucno=' + m[2] + ' and modelindex=' + m[1];
        }
    }
});






/**
 * widget class for selections
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomSelection.SelectorWidget = function(params){
    params = _.defaults( params, this.default_params );
    _.extend( this, _.pick( params, [ "applet" ] ) );
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 'selection' ]);
    var template = '' +
        '<label for="${eids.selection}">${params.selection_label}:</label>&nbsp;' +
        '<input id="${eids.selection}" type="text"/>' +
    '';
    this.add_content( template, params );
    this.init();
}
Provi.Bio.AtomSelection.SelectorWidget.prototype = Utils.extend(Widget, /** @lends Provi.Selection.SelectorWidget.prototype */ {
    default_params: {
        selection_label: "Selection"
    },
    init: function(){
        
    },
    get: function(selection){
        return this.elm('selection').val() || "";
    },
    set_input: function(sele){
        this.elm('selection').val( sele );
    },
    set_applet: function( applet ){
        this.applet = applet;
    }
});



})();