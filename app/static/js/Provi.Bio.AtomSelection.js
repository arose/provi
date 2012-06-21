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
Provi.Bio.AtomSelection.AtomSelection = function(name){
    this.name = name;
};
Provi.Bio.AtomSelection.AtomSelection.prototype = /** @lends Provi.Bio.AtomSelection.AtomSelection.prototype */ {
    sele: function(flag){
        if(flag){
            return 'provi_selection["' + this.name + '"]';
        }else{
            return '@{ provi_selection["' + this.name + '"] }';
        }
    }
};


/**
 * @class Represents atom property group
 */
Provi.Bio.AtomSelection.AtomSelectionGroup = function(names){
    var self = this;
    this._list = [];
    _.each(names, function(name){
        self.add( new Provi.Bio.AtomSelection.AtomSelection(name) );
    });
    // console.log( this.get_list() );
};
Provi.Bio.AtomSelection.AtomSelectionGroup.prototype = /** @lends Provi.Bio.AtomSelection.AtomSelectionGroup.prototype */ {
    add: function(atom_selection){
        this._list.push( atom_selection );
    },
    get_list: function(){
        return this._list;
    }
};


/**
 * widget class
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomSelection.AtomSelectionWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.AtomSelection.AtomSelectionWidget.prototype.default_params
    );
    params.persist_on_applet_delete = false;

    this.dataset = params.dataset;
    this.applet = params.applet;
    this.selection_name = params.selection_name;
    
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([
        'selection_name', 'show_all', 'show_none'
    ]);

    var template = '' +
        '<div class="control_row">' + 
            '<div id="${eids.selection_name}">' +
                'Name: <span>${params.selection_name}</span>' +
            '</div>' +
        '</div>' +
        '<div class="control_row">' +
            'show:&nbsp;' +
            '<button id="${eids.show_all}">all</button>' +
            '<button id="${eids.show_none}">none</button>' +
        '</div>' +
    '';
    this.add_content( template, params );
    this._init();
}
Provi.Bio.AtomSelection.AtomSelectionWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.AtomSelection.AtomSelectionWidget.prototype */ {
    default_params: {
        heading: 'Atom selection',
        collapsed: false
    },
    _init: function () {
        var self = this;
        
        // init select
        this.elm('show_all').button().click(function(){
            if(self.applet){
                var s = 'display add @{ provi_selection["' + self.selection_name + '"] };';
                console.log(s);
                self.applet.script_wait(s, true);
            }
        });
        this.elm('show_none').button().click(function(){
            if(self.applet){
                self.applet.script_wait(
                    'display remove @{ provi_selection["' + self.selection_name + '"] };'
                );
            }
        });

        Provi.Widget.Widget.prototype.init.call(this);
    }
});




/**
 * A widget
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.AtomSelection.GridWidget = function(params){
    params = _.defaults(
        params,
        Provi.Bio.AtomSelection.GridWidget.prototype.default_params
    );
    console.log('SEQUENCE GRID', params);
    params.persist_on_applet_delete = true;
    params.heading = 'Sequence Grid';
    params.collapsed = false;
    Provi.Widget.Widget.call( this, params );
    this._init_eid_manager([ 'grid', 'update', 'type' ]);
    
    this.dataset = params.dataset;
    this.applet = params.applet;
    
    var template = '' +
        '<div class="control_row">' +
            '<select id="${eids.type}" class="ui-state-default">' +
                '<option value="atomindex">Atoms</option>' +
                '<option value="groupindex">Groups</option>' +
                '<option value="chainlabel">Chains</option>' +
                '<option value="modelindex">Models</option>' +
                '<option value="variable">Selections</option>' +
                '<option value="voronoia">Voronoia</option>' +
            '</select>' +
            '&nbsp;' +
            '<button id="${eids.update}">update</button>' +
        '</div>' +
        '<div class="control_row">' +
            '<div style="height:500px;" id="${eids.grid}"></div>' +
        '</div>' +
    '';
    
    this.add_content( template, params );
    this._init();
}
Provi.Bio.AtomSelection.GridWidget.prototype = Utils.extend(Provi.Widget.Widget, /** @lends Provi.Bio.AtomSelection.GridWidget.prototype */ {
    default_params: {
        
    },
    _init: function(){
        var self = this;
        
        var type = 'atomindex';
        this.sele_type = new (Provi.Bio.AtomSelection.SelectionTypeRegistry.get( type ))({ 
            applet: this.applet
        });
        console.log(this.sele_type);

        this.create_grid();
        this.update_grid();
        
        if( this.applet ){
            $(this.applet).bind('load_struct', function(){
                // var type = self.elm('type').children("option:selected").val();
                // self.sele_type = new (Provi.Bio.AtomSelection.SelectionTypeRegistry.get( type ))({ 
                //     applet: self.applet
                // });
                self.update_grid();
            });
            $(this.applet).bind('script', function(){
                //self.update_grid();
            });
            $(this.applet).bind('select', function(){
                //self.update_grid();
            });
        }

        this.elm('update').button().click(function(){
            self.update_grid();
        });

        this.elm('type').bind('change', function(){
            var type = self.elm('type').children("option:selected").val();
            self.sele_type = new (Provi.Bio.AtomSelection.SelectionTypeRegistry.get( type ))({ 
                applet: self.applet
            });
            self.update_grid();
        });

        $( this.eid('grid', true) + ' input[title="selected"]' ).live( 'click', function(e, data){
            var elm = $(this);
            var id = elm.data("id");
            self.sele_type.select( id, !elm.prop('checked') );
            console.log("selected");
            self.invalidate();
        });

        $( this.eid('grid', true) + ' input[title="displayed"]' ).live( 'click', function(e, data){
            var elm = $(this);
            var id = elm.data("id");
            self.sele_type.display( id, !elm.prop('checked') );
            console.log("displayed");
            self.invalidate();
        });

        $( this.eid('grid', true) + ' input[title="hole"]' ).live( 'click', function(e, data){
            var elm = $(this);
            var id = elm.data("id");
            self.sele_type.show_hole( id, !elm.prop('checked') );
            console.log("hole");
            self.invalidate();
        });

        $( this.eid('grid', true) + ' input[title="cavity"]' ).live( 'click', function(e, data){
            var elm = $(this);
            var id = elm.data("id");
            self.sele_type.show_cavity( id, !elm.prop('checked') );
            console.log("checked");
            self.invalidate();
        });

        $( this.eid('grid', true) + ' input[title="neighbours"]' ).live( 'click', function(e, data){
            var elm = $(this);
            var id = elm.data("id");
            self.sele_type.show_neighbours( id, !elm.prop('checked') );
            console.log("neighbours");
            self.invalidate();
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
            // var row = self.sele_type.make_row( dataContext.id );
            // $(cell).empty().append( row );
            return '...';
        }
        
        var columns = [
            { 
                id:"id", name:"Id", field:"id", width:280,
                rerenderOnResize: true,
                //formatter: format_cell,
                asyncPostRender: render_row
            }
        ];
        
        var options = {
            enableCellNavigation: false,
            enableColumnReorder: false,
            enableAsyncPostRender: true,
            asyncPostRenderDelay: 0,
            showHeaderRow: true,
            headerRowHeight: 30
        };
        
        // data = [ { resno: "1", chain: "A", atomno: 1, group:"Lys", selected:1.0 } ];
        var data = [];
        this.grid = new Slick.Grid( this.eid('grid', true), data, columns, options);
        //this.grid = new Slick.Grid( $('#grid'), data, columns, options);
        //console.log( this.grid );
        
    },
    invalidate: function(){
        console.log('invalidate');
        this.grid.invalidate();
        this.header();
    },
    header: function(){
        var header = this.grid.getHeaderRowColumn('id');
        $(header).empty().append(
            this.sele_type.make_row('all')
        );
        $(header).css('padding', '1px 3px 2px 1px');
        // $(header).css('padding', '1px');
    },
    update_grid: function(){
        var self = this;
        if( this.applet ){
            console.log("update grid");
            //var selection = 'protein and {*}';
            //var selection = '*';
            //var selection = '(nucleic and *.P) or (protein and *.CA)';
            var selection = '*';
            
            var ids = this.sele_type.get_ids(selection);
            var data = _.map( ids, function(val, i){
                return { id: val }
            });
            //console.log( data );
            this.grid.setData( data );
            this.grid.updateRowCount();
            this.grid.render();

            this.header();
        }
    }
});


Provi.Bio.AtomSelection.SelectionType = function(params){
    this.applet = params.applet;
    this.parent_id = params.parent_id;
}
Provi.Bio.AtomSelection.SelectionType.prototype = {
    get_ids: function(sele){},
    get_data: function(id){},
    make_row: function(id){},
    selection: function(id){},
    select: function(id, flag){
        var selection = this.selection( id );
        var s = 'select ' + (flag ? 'remove' : 'add') + ' ' + selection;
        this.applet.script( s );
    },
    display: function(id, flag){
        var selection = this.selection( id );
        var s = 'display ' + (flag ? 'remove' : 'add') + ' ' + selection;
        this.applet.script( s );
    },
    label_cell: function(label){
        var $label = $('<span style="float:left; width:120px;">' +
            label +
        '</span>');
        return $label;
    },
    selected_cell: function(id, selected){
        selected = parseFloat(selected);
        var $selected = $('<span style="float:left; width:25px;">' +
            '<input title="selected" type="checkbox"' + 
                ( selected ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $selected.children().prop( 'indeterminate', selected > 0.0 && selected < 1.0 );
        $selected.children().data( 'id', id );
        return $selected;
    },
    displayed_cell: function(id, displayed){
        displayed = parseFloat(displayed);
        var $displayed = $('<span style="float:left; width:25px;">' +
            '<input title="displayed" type="checkbox"' + 
                ( displayed ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $displayed.children().prop( 'indeterminate', displayed > 0.0 && displayed < 1.0 );
        $displayed.children().data( 'id', id );
        return $displayed;
    },
    color_cell: function(color){
        color = color || '';
        color = color.replace(/\.00/g, ' ').trim();
        var c = "0,0,0";
        if( color ){ c = color.split(/\s+/g).join(','); }
        var $color = $("<span " +
            "style='float:right; width:30px; " +
            "background-color:rgb(" + c + ");'>&nbsp;" +
        "</span>");
        return $color;
    }
};

Provi.Bio.AtomSelection.AtomindexSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.AtomindexSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.AtomindexSelectionType.prototype */ {
    get_ids: function(sele){
        var format = '%[atomIndex]';
        var data = this.applet.atoms_property_map( format, sele );
        data = _.map(data, function(val){
            return val[0];
        });
        return data;
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
            var selected = a[6];
            var color = a[7];
        }
        var d = '{displayed and ' + this.selection(id) + '}.length.join("")/' +
            '{' + this.selection(id) + '}.length.join("")';
        var displayed = this.applet.evaluate(d);

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, selected ),
            this.displayed_cell( id, displayed ),
            this.label_cell( label ),
            this.color_cell( color )
        );
        return $row;
    },
    selection: function(id){
        return id==='all' ? '*' : '({' + id + '})';
    }
});


Provi.Bio.AtomSelection.GroupindexSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.GroupindexSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.GroupindexSelectionType.prototype */ {
    get_ids: function(sele){
        var s = '{' + sele + '}.groupindex.all.count().join("")';
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
            var a = this.applet.atoms_property_map( format, this.selection(id), true )[0];
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
        var d = '{displayed and ' + this.selection(id) + '}.length.join("")/' +
            '{' + this.selection(id) + '}.length.join("")';
        var displayed = this.applet.evaluate(d);

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[5] ),
            this.displayed_cell( id, displayed ),
            this.label_cell( label )
        );
        return $row;
    },
    selection: function(id){
        return id==='all' ? '*' : 'groupindex=' + id;
    }
});


Provi.Bio.AtomSelection.ChainlabelSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.ChainlabelSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.ChainlabelSelectionType.prototype */ {
    get_ids: function(sele){
        var s = '' +
            '{' + sele + '}.file.all' +
                '.add(".", {' + sele + '}.model.all )' +
                '.add(":", {' + sele + '}.chain.all )' +
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
        return [ this.selection(id), selected ];
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Chains";
        }else{
            var label = a[0];
        }
        var d = '{displayed and ' + this.selection(id) + '}.length.join("")/' +
            '{' + this.selection(id) + '}.length.join("")';
        var displayed = this.applet.evaluate(d);

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[1] ),
            this.displayed_cell( id, displayed ),
            this.label_cell( label )
        );
        return $row;
    },
    selection: function(id){
        if(id==="all"){
            return '*';
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
    get_ids: function(sele){
        var s = '{' + sele + '}.modelindex.all.count().join("")';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split('\t');
        data = _.filter(data, function(val, i){
            return i % 2 == 0;
        });
        return data;
    },
    get_data: function(id){
        var format = '\'%[file]\',\'%[model]\'';
        var a = this.applet.atoms_property_map( format, this.selection(id), true )[0];
        var s = '{' + this.selection(id) + '}.selected.join("")';
        var selected = this.applet.evaluate(s);
        a.push( selected );
        return a;
    },
    make_row: function(id){
        var a = this.get_data(id);
        if(id==="all"){
            var label = "Models";
        }else{
            var label = '/' + a[0] + '.' + a[1];
        }
        var d = '{displayed and ' + this.selection(id) + '}.length.join("")/' +
            '{' + this.selection(id) + '}.length.join("")';
        var displayed = this.applet.evaluate(d);

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, a[2] ),
            this.displayed_cell( id, displayed ),
            this.label_cell( label )
        );
        return $row;
    },
    selection: function(id){
        return id==='all' ? '*' : 'modelindex=' + id;
    }
});


Provi.Bio.AtomSelection.VariableSelectionType = function(params){
    Provi.Bio.AtomSelection.SelectionType.call( this, params );
}
Provi.Bio.AtomSelection.VariableSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.SelectionType, /** @lends Provi.Bio.AtomSelection.VariableSelectionType.prototype */ {
    get_ids: function(sele){
        var s = 'provi_selection.keys.join(",")';
        var data = this.applet.evaluate(s);
        if(data) data = data.trim().split(',');
        return data;
    },
    get_data: function(id){
        // var s = '{' + sele + '}.modelindex.all.count().join("")';
        // var data = this.applet.evaluate(s);
        // if(data) data = data.trim().split('\t');
        // data = _.filter(data, function(val, i){
        //     return i % 2 == 0;
        // });
        var a = [];
        var s = this.selection(id, true) + '.selected.join("")';
        var selected = this.applet.evaluate(s);
        console.log(selected);
        a.push( selected );
        return a;
    },
    make_row: function(id){
        var a = this.get_data(id);
        var $row = $('<div></div>');
        var label = id;

        $row.append(
            this.selected_cell( id, a[0] ),
            this.label_cell( label )
        );
        return $row;
    },
    selection: function(id, flag){
        if(flag){
            return 'provi_selection["' + id + '"]';
        }else{
            return '@{ provi_selection["' + id + '"] }';
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
        // 'filelabel': Provi.Bio.AtomSelection.FilelabelSelectionType,
        // 'strucnolabel': Provi.Bio.AtomSelection.ScrucnolabelSelectionType,
        // 'moleculelabel': Provi.Bio.AtomSelection.MoleculelabelSelectionType,
    },
    add: function( name, obj ){
        Provi.Bio.AtomSelection.SelectionTypeRegistry._dict[ name ] = obj;
    },
    get: function( name ){
        console.log( Provi.Bio.AtomSelection.SelectionTypeRegistry._dict );
        return Provi.Bio.AtomSelection.SelectionTypeRegistry._dict[ name ];
    }
};

})();