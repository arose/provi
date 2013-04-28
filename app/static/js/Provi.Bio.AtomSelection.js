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
Provi.Bio.AtomSelection.AtomSelection.prototype = /** @lends Provi.Bio.AtomSelection.AtomSelection.prototype */ {
    load: function(){
        var s = 'provi_load_selection("' + this.dataset.url + '", "' + this.dataset.id + '");';
        this.applet.script(s, { maintain_selection: true, try_catch: false });
    },
    get_list: function(){
        return this.applet.evaluate( "provi_datasets[" + this.dataset.id + "].join(',')" ).split(",");
    }
};



// /**
//  * @class Represents atom property group
//  */
// Provi.Bio.AtomSelection.AtomSelectionGroup = function(names){
//     var self = this;
//     this._list = [];
//     _.each(names, function(name){
//         self.add( new Provi.Bio.AtomSelection.AtomSelection(name) );
//     });
//     // console.log( this.get_list() );
// };
// Provi.Bio.AtomSelection.AtomSelectionGroup.prototype = /** @lends Provi.Bio.AtomSelection.AtomSelectionGroup.prototype */ {
//     add: function(atom_selection){
//         this._list.push( atom_selection );
//     },
//     get_list: function(){
//         return this._list;
//     }
// };



/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomSelection.GridWidget = function(params){
    this.invalidate = _.throttle( this._invalidate, 100, false );
    params = _.defaults( params, this.default_params );
    console.log('ATOMSELECTION GRID', params);
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 
        'grid', 'update', 'type', 'filter', 'sort', 'property', 'widgets',
        'calc', 'init'
    ]);
    
    var p = [ "dataset", "applet", "type", "heide_eids" ];
    _.extend( this, _.pick( params, p ) );
    
    var template = '' +
        '<div class="control_row">' +
            '<select id="${eids.type}" class="ui-state-default">' +
                '<option value="atomindex">Atoms</option>' +
                '<option value="groupindex">Groups</option>' +
                '<option value="chainlabel">Chains</option>' +
                '<option value="modelindex">Models</option>' +
                '<option value="variable">Selections</option>' +
                '<option value="strucno">Structures</option>' +
                '<option value="helixorient">Helixorient</option>' +
                '<option value="helixcrossing">Helixcrossing</option>' +
                '<option value="hbonds">Hydrogen bonds</option>' +
                '<option value="settings">Settings</option>' +
            '</select>' +
            '&nbsp;' +
            '<button id="${eids.update}">update</button>' +
            '&nbsp;' +
            '<button id="${eids.calc}">calc</button>' +
            '&nbsp;' +
            '<button id="${eids.init}">init</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.property}">Property:&nbsp;</label>' +
            '<select id="${eids.property}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="vdwradius">vdW radius</option>' +
                '<option value="volume">vdw volume</option>' +
                '<option value="temperature">temperature</option>' +
                '<option value="charge">charge</option>' +
                '<option value="formalcharge">formalcharge</option>' +
                '<option value="partialcharge">partialcharge</option>' +
                '<option value="phi">phi</option>' +
                '<option value="psi">psi</option>' +
                '<option value="property_buried_flag">buried (voronoia)</option>' +
                '<option value="property_volume_vdw">volume vdw (voronoia)</option>' +
                '<option value="property_volume_vdw_1_4">volume vdw + 1.4 A (voronoia)</option>' +
                '<option value="property_packing_density">packing density (voronoia)</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.sort}">Sort:&nbsp;</label>' +
            '<select id="${eids.sort}" class="ui-state-default">' +
                '<option value=""></option>' +
                '<option value="vdwradius">vdW radius</option>' +
                '<option value="volume">vdw volume</option>' +
                '<option value="temperature">temperature</option>' +
                '<option value="charge">charge</option>' +
                '<option value="formalcharge">formalcharge</option>' +
                '<option value="partialcharge">partialcharge</option>' +
                '<option value="phi">phi</option>' +
                '<option value="psi">psi</option>' +
                '<option value="property_buried_flag">buried (voronoia)</option>' +
                '<option value="property_volume_vdw">volume vdw (voronoia)</option>' +
                '<option value="property_volume_vdw_1_4">volume vdw + 1.4 A (voronoia)</option>' +
                '<option value="property_packing_density">packing density (voronoia)</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="${eids.filter}">Filter:&nbsp;</label>' +
            '<input id="${eids.filter}" type="text"/>' +
            '<div style="font-style:italic; margin-left: 15px">' +
                'property_buried_flag=1<br/>' +
                'within(BASEPAIR, "GCAU")<br/>' +
                'sidechain<br/>' +
            '</div>' +    
        '</div>' +
        '<div class="control_row" id="${eids.widgets}"></div>' +
        '<div class="control_row">' +
            '<div style="height:500px;" id="${eids.grid}"></div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    this._init();
}
Provi.Bio.AtomSelection.GridWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.AtomSelection.GridWidget.prototype */ {
    default_params: {
        heading: 'Selection Grid',
        collapsed: false,
        type: 'groupindex',
        hide_eids: [],
        persist_on_applet_delete: false
    },
    _init: function(){
        var self = this;

        this.create_grid();
        this.update_type();
        // this.update_grid();

        _.each( this.hide_eids, function(eid){
            self.elm( eid ).parent().hide();
        });

        if( this.applet ){
            $(this.applet).bind('load_struct', function(e, fullPathName, fileName){
                if(fullPathName && fileName!='zapped'){
                    console.log( fullPathName, fileName );
                    setTimeout(function(){
                        self.create_grid();
                        self.update_type();
                    }, 10);
                }
            });
            $(this.applet).bind('script', function(){
                //self.update_grid();
                //self.invalidate();
            });
            $(this.applet).bind('select', function(){
                //self.update_grid();
                self.invalidate();
            });
        }

        this.elm('update').button().click( _.bind( self.update_grid, self ) );

        this.elm('calc').button().click( function(){
            self.sele_type.calculate();
        });

        this.elm('init').button().click( function(){
            self.sele_type._init( self );
        });

        this.elm('type').bind('change', function(){
            self.type = self.elm('type').children("option:selected").val();
            self.update_type();
        });

        this.elm('sort').bind('change', function(){
            self.update_type();
        });

        this.elm('property').bind('change', function(){
            var property = self.elm('property').children("option:selected").val();
            self.sele_type.property = property;
            self.invalidate();
        });

        this.elm('filter').keypress(function(e){
            if (e.which == 13) {
                self.update_type();
            }
        });
        
        Provi.Widget.Widget.prototype.init.call(this);
    },
    create_grid: function(){
        var self = this;

        var render_row = function(cellNode, row, dataContext, colDef) {
            var row = self.sele_type.make_row( dataContext.id );
            //console.log( dataContext.id );
            $(cellNode).empty().append( row );
        }

        var format_cell = function(row, cell, value, columnDef, dataContext){
            // console.log( dataContext.id );
            var row = self.sele_type.make_row( dataContext.id );
            // $(cell).empty().append( row );
            // return '...';
            return row.html();
        }
        
        var columns = [
            { 
                id:"id", name:"Id", field:"id", width:350,
                rerenderOnResize: true,
                // formatter: format_cell
                asyncPostRender: render_row
            }
        ];
        
        var options = {
            enableCellNavigation: false,
            enableColumnReorder: false,
            enableAsyncPostRender: true,
            asyncPostRenderDelay: 1,
            showHeaderRow: true,
            headerRowHeight: 25,
            //rowHeight: 140,
            topPanelHeight: 25,
            autoHeight: false
        };
        
        // data = [ { resno: "1", chain: "A", atomno: 1, group:"Lys", selected:1.0 } ];
        var data = [];
        delete this.grid;
        this.grid = new Slick.Grid( this.eid('grid', true), data, columns, options);
        //this.grid = new Slick.Grid( $('#grid'), data, columns, options);
        //console.log( this.grid );
    },
    _invalidate: function(){
        this.grid.invalidate();
        this.header();
        this.grid.resizeCanvas();
    },
    header: function(){
        var header = this.grid.getHeaderRowColumn('id');
        $(header).empty().append(
            this.sele_type.make_row('all')
        );
        $(header).css('padding', '1px 3px 2px 1px');
        // $(header).css('padding', '1px');
    },
    update_type: function(){
        var self = this;
        var type = this.type || 'atomindex';
        this.elm('type').val( type );
        this.sele_type = new (Provi.Bio.AtomSelection.SelectionTypeRegistry.get( type ))({ 
            applet: this.applet,
            sele: '*',
            filter: this.elm('filter').val(),
            sort: this.elm('sort').children("option:selected").val(),
            property: this.elm('property').children("option:selected").val()
        });

        var invalidate = _.bind( this.invalidate, this );

        this.elm("widgets").empty();
        this.sele_type._init.call( this.sele_type, this );

        $(this.sele_type).bind("init_ready", function(){
            self.sele_type.calculate();
        });

        $(this.sele_type).bind("calculate_ready", function(){
            self.update_grid();
        });

        this.elm('grid').off( 'click.grid' );
        _.each( this.sele_type.handler, function(d, i){
            self.elm('grid').on( 'click.grid', d["selector"], function(e){
                var elm = $(e.currentTarget);
                //elm.parent().tipsy('hide');
                elm.qtip('hide');
                var id = elm.data("id");
                var flag = !elm.prop('checked');
                d["click"].apply( self.sele_type, [ id, flag, {}, invalidate ]);
            });

            if( !_.isFunction(d["label"]) ){
                var label = d["label"];
                d["label"] = function(value, id){
                    var l = label ? ' ' + label : '';
                    if( id==='all' ){
                        l = ' all' + ( l ? _.pluralize( l ) : '' );
                    }
                    return (value ? 'Hide' : 'Show') + l;
                }
            }

            self.elm('grid').on( 'mouseover', d["selector"], function(e){
                $(this).qtip({
                    overwrite: false,
                    content: '?',
                    show: {
                        event: event.type,
                        ready: true
                    }
                }, event);
                var elm = $(e.originalEvent.target);
                $(this).qtip('option', 'content.text', d["label"]( elm.prop('checked'), elm.data("id") ) );
            });
        });

        this.update_grid();
    },
    update_grid: function(){
        var self = this;
        if( this.applet ){
            var ids = this.sele_type.get_ids();
            var data = _.map( ids, function(val, i){
                return { id: val }
            });
            //console.log( data );
            this.grid.setData( data );
            this.grid.updateRowCount();
            this.grid.render();

            this.header();
            this.grid.resizeCanvas();
        }
    }
});


Provi.Bio.AtomSelection.CellFactory = function( p ){
    p.color = p.color || "none";
    p.position = p.position || "right";
    return function(id, value, disabled){
        var $elm = $(
            '<span style="background:' + p.color + '; float:' + p.position + '; width:22px;">' +
                '<input cell="' + p.name + '" type="checkbox" ' + 
                    ( disabled ? 'disabled="disabled" ' : '') +
                    ( value ? 'checked="checked" ' : '' ) + 
                '/>' +
            '</span>'
        );
        $elm.children().prop( 'indeterminate', value > 0.0 && value < 1.0 );
        $elm.children().data( 'id', id );
        return $elm;
    }
}


Provi.Bio.AtomSelection.SelectionType = function(params){
    var p = [ "applet", "parent_id", "sele", "filter", "sort", "property" ];
    _.extend( this, _.pick( params, p ) );

    this.handler = {
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
    };
}
Provi.Bio.AtomSelection.SelectionType.prototype = {
    handler: {},
    _init: function(){
        this.initialized = true;
        $(this).trigger("init_ready");
    },
    calculate: function(){
        this.ready = true;
        $(this).trigger("calculate_ready");
    },
    get_ids: function(){},
    get_data: function(id){},
    make_row: function(id){},
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
    selected_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "selected", "position": "left"
    }),
    displayed_cell: Provi.Bio.AtomSelection.CellFactory({
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
};

Provi.Bio.AtomSelection.AtomindexSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.AtomindexSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.AtomindexSelectionType.prototype */ {
    get_ids: function(){
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


Provi.Bio.AtomSelection.GroupindexSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.GroupindexSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.GroupindexSelectionType.prototype */ {
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


Provi.Bio.AtomSelection.ChainlabelSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.ChainlabelSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.ChainlabelSelectionType.prototype */ {
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


Provi.Bio.AtomSelection.ModelindexSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.ModelindexSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.ModelindexSelectionType.prototype */ {
    get_ids: function(){
        var s = '{' + this.filtered() + '}.modelindex.all.count().join("")';
        var data = this.applet.evaluate(s);
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


Provi.Bio.AtomSelection.VariableSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.VariableSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.VariableSelectionType.prototype */ {
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


Provi.Bio.AtomSelection.StrucnoSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.StrucnoSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.StrucnoSelectionType.prototype */ {
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





Provi.Bio.AtomSelection.SelectionTypeRegistry = {
    _dict: {
        'atomindex': Provi.Bio.AtomSelection.AtomindexSelectionType,
        'groupindex': Provi.Bio.AtomSelection.GroupindexSelectionType,
        'chainlabel': Provi.Bio.AtomSelection.ChainlabelSelectionType,
        'modelindex': Provi.Bio.AtomSelection.ModelindexSelectionType,
        'variable': Provi.Bio.AtomSelection.VariableSelectionType,
        'strucno': Provi.Bio.AtomSelection.StrucnoSelectionType,
        // 'filelabel': Provi.Bio.AtomSelection.FilelabelSelectionType,
        // 'strucnolabel': Provi.Bio.AtomSelection.ScrucnolabelSelectionType,
        // 'moleculelabel': Provi.Bio.AtomSelection.MoleculelabelSelectionType,
    },
    add: function( name, obj ){
        Provi.Bio.AtomSelection.SelectionTypeRegistry._dict[ name ] = obj;
    },
    get: function( name ){
        // console.log( Provi.Bio.AtomSelection.SelectionTypeRegistry._dict );
        return Provi.Bio.AtomSelection.SelectionTypeRegistry._dict[ name ];
    }
};


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