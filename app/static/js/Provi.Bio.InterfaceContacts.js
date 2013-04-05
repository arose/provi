/**
 * @fileOverview This file contains the {@link Provi.Bio.InterfaceContacts} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Interface contacts module
 */
Provi.Bio.InterfaceContacts = {};

(function() {

/** @exports Utils as Provi.Utils */
var Utils = Provi.Utils;

/** @exports Widget as Provi.Widget.Widget */
var Widget = Provi.Widget.Widget;

Provi.Bio.InterfaceContacts.register = function( params ){
    var contacts_ds = params.contacts_ds;
    var contacts_ds2 = params.contacts_ds2;
    console.log( "InterfaceContacts.register", contacts_ds, contacts_ds2 );
    Provi.Bio.AtomSelection.SelectionTypeRegistry.add(
        'interface_contacts', Provi.Bio.InterfaceContacts.InterfaceContactsSelectionTypeFactory(
            _.pluck( contacts_ds.get().get_list(), 'name' ),
            contacts_ds2.id
        )
    )
}

Provi.Bio.InterfaceContacts.InterfaceContactsSelectionTypeFactory = function(ids, dataset_id){
    return function(params){
        params.ids = ids;
        params.dataset_id = dataset_id;
        return new Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType(params);
    }
}

Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType = function(params){
    var self = this;
    this.ids = params.ids;
    this.dataset_id = params.dataset_id;
    this.ids.sort();

    this.ids = [ 'Membrane', 'Water' ].concat( this.ids );

    var type_count = { 'H': 1, 'C': 1, 'E': 1, 'W': 1, 'O': 1 };
    var type_names = {
        'H': 'Helix',
        'C': 'Coil',
        'E': 'Sheet',
        'W': 'Water',
        'O': 'Hetero'
    }

    this.id_names = {};

    _.each( this.ids, function(id){
        var c = id.charAt(0)
        if( type_names[ c ] && /[0-9]/.test(id.charAt(1)) ){
            self.id_names[id] = '' + 
                type_names[ c ] + ' ' + 
                type_count[ c ] + 
                // ' (' + id + ')' +
            '';
            type_count[ c ] += 1;
        }
    })

    this.atm_cutoff = [
        [ '-0.5', '[xFFFF00]' ],
        [ '0.0', '[xFFA500]' ],
        [ '0.5', '[xEB8900]' ],
        [ '1.0', '[xD86E00]' ],
        [ '1.5', '[xC55200]' ],
        [ '2.0', '[xB13700]' ],
        [ '2.5', '[x9E1B00]' ],
        [ '2.8', '[x8B0000]' ]
    ];
    this.atm_cutoff.reverse();

    Provi.Bio.AtomSelection.SelectionType.call( this, params );
    this.handler = _.defaults({
        "show_consurf": {
            "selector": 'input[cell="consurf"]',
            "click": this.show_consurf
        },
        "show_intersurf": {
            "selector": 'input[cell="intersurf"]',
            "click": this.show_intersurf
        },
        "show_contacts": {
            "selector": 'input[cell="contacts"]',
            "click": this.show_contacts
        }
    }, this.handler );
}
Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType.prototype = Utils.extend(Provi.Bio.AtomSelection.VariableSelectionType, /** @lends Provi.Bio.InterfaceContacts.InterfaceContactsSelectionType.prototype */ {
    _init: function(grid){
        var self = this;
        this.initialized = false;
        this.applet.script_callback('' +
            'script "../data/jmol_script/interface_contacts.jspt";' +
        '', {}, function(){
            self.initialized = true;
            $(self).trigger("init_ready");
        });
        var template = '' +
            '<div class="control_row">' +
                '<span style="background-color:#FFFF00; padding: 1px 3px;">&#8209;0.5</span>' +
                '<span style="background-color:#FFA500; padding: 1px 3px;">0.0</span>' +
                '<span style="background-color:#EB8900; padding: 1px 3px;">0.5</span>' +
                '<span style="background-color:#D86E00; padding: 1px 3px;">1.0</span>' +
                '<span style="background-color:#C55200; padding: 1px 3px;">1.5</span>' +
                '<span style="background-color:#B13700; padding: 1px 3px; color: white;">2.0</span>' +
                '<span style="background-color:#9E1B00; padding: 1px 3px; color: white;">2.5</span>' +
                '<span style="background-color:#8B0000; padding: 1px 3px; color: white;">2.8</span>' +
                '&nbsp;contact cutoff' +
            '</div>' +
        '';
        grid.elm("widgets").append( template );
        $(this).bind("calculate_ready", function(){
            self.show_contacts( 'Membrane', undefined, {}, _.bind( grid.invalidate, grid ) );
        });
    },
    tmp_prop_cmd: function(id){
        var self = this;
        var tmp_prop = '{*}.property_tmp = NaN;';
        _.each(this.atm_cutoff, function(d){
            tmp_prop += '{ @provi_selection["' + id.split('_')[0] + '_' + d[0] + '_' + self.dataset_id + '"] }' +
                '.property_tmp = ' + d[0] + ';';
        });
        return tmp_prop;
    },
    is_virtual: function(id){
        return _.include( ['Membrane', 'Water'], id );
    },
    get_ids: function(sele){
        return this.ids;
    },
    get_data: function(id){
        if( !this.ready ) return [0, 0, 0];
        var ids = (id=="all") ? this.get_ids() : [id];
        var s = 'provi_intercon_test( ["' + ids.join('","') + '"] ).join(",")';
        var a = this.applet.evaluate(s).split(",");
        var selected = a[0];
        var consurf = parseFloat(a[1]);
        var intersurf = parseFloat(a[2]);
        return [ selected, consurf, intersurf ];
    },
    make_row: function(id){
        if(id==='all'){
            var label = 'Interface elements'
        }else{
            var label = this.id_names[ id ] || id;
        }
        var a = this.get_data(id);
        var selected = a[0];
        var contacts = this.shown_contact_id === id;
        var consurf = a[1];
        var intersurf = a[2];

        var $row = $('<div></div>');
        $row.append(
            this.selected_cell( id, selected, this.is_virtual(id) ),
            this.label_cell( label ),
            this.contacts_cell( id, contacts ),
            this.consurf_cell( id, consurf ),
            this.intersurf_cell( id, intersurf )
        );
        return $row;
    },
    _show_consurf: function(id, flag, params){
        params = params || {};
        var resolution = params.resolution || 2.0;
        var probe_radius = params.probe_radius || 1.4;
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'isosurface id "' + id + '_consurf__no_widget__" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                return 'set drawHover true;' +
                    'set isosurfacePropertySmoothing false;' +
                    self.tmp_prop_cmd(id) +
                    'var sele = {' + 
                        'property_tmp>=-0.5 and ' +
                        'property_tmp<=2.8' +
                    '};' +
                    'var sele2 = ' + 
                        (self.is_virtual(id) ? 'none' : self.selection(id, true)) + ';' +
                    'var sele3 = ' + 
                        (self.is_virtual(id) ? 'sele' : self.selection(id, true)) + ';' +
                    'isosurface id "' + id + '_consurf__no_widget__" ' +
                        'select { @sele } ' +
                        'ignore { @sele2 } ' +
                        'resolution ' + resolution + ' ' +
                        'color orange ' +
                        'solvent ' + probe_radius + ' ' +
                    ';' +
                    'isosurface id "' + id + '_consurf__no_widget__" ' +
                        'slab within 5.0 { @sele3 };' +
                    'select *; ' +
                    'color "ic=[xFFFF00] [xFFA500] [xEB8900] [xD86E00] [xC55200] [xB13700] [x9E1B00] [x8B0000]";' +
                    'isosurface ID "' + id + '_consurf__no_widget__" ' + 
                        'MAP property_tmp;' +
                    'color $' + id + '_consurf__no_widget__ "ic" ' +
                        ' RANGE -0.5 2.8;' +
                '';
            }).join(' ');
        }
    },
    show_consurf: function(id, flag, params, callback){
        var s = this._show_consurf(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true }, callback );
    },
    _show_intersurf: function(id, flag, params){
        params = params || {};
        var resolution = params.resolution || 2.0;
        var probe_radius = params.probe_radius || 1.4;
        var self = this;
        var ids = (id==='all') ? this.get_ids() : [ id ];
        if(flag){
            return _.map( ids, function(id){
                return 'isosurface id "' + id + '_intersurf__no_widget__" delete;';
            }).join(' ');
        }else{
            return _.map( ids, function(id){
                return 'set drawHover true;' +
                    'isosurface id "' + id + '_intersurf__no_widget__" ' +
                        'select { ' + self.selection(id) + ' } ' +
                        'ignore { not ' + self.selection(id) + ' } ' +
                        'resolution ' + resolution + ' ' +
                        'color pink ' +
                        'solvent ' + probe_radius + ' ' +
                    ';' +
                '';
            }).join(' ');
        }
    },
    show_intersurf: function(id, flag, params, callback){
        var s = this._show_intersurf(id, flag, params);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: true }, callback );
    },
    _show_contacts: function(id, flag){
        if( flag || id =="all" ){
            return 'color {*} cpk;';
        }
        return '' +
            'color {*} cpk;' +
            //color_cmd +
            this.tmp_prop_cmd(id) +
            'select ' + 
                'property_tmp>=-0.5 and ' +
                'property_tmp<=2.8;' +
                // 'property_' + id + '>=-0.5 and ' +
                // 'property_' + id + '<=2.8;' +
            'color "ic=[xFFFF00] [xFFA500] [xEB8900] [xD86E00] [xC55200] [xB13700] [x9E1B00] [x8B0000]";' +
            // 'color atoms property_' + id + ' "ic" ' +
            'color atoms property_tmp "ic" ' +
                ' RANGE -0.5 2.8;' +
            'select ' + this.selection(id) + ';' +
            'color atoms pink;' +
        '';
    },
    show_contacts: function(id, flag, params, callback){
        if(flag){
            this.shown_contact_id = undefined;
        }else{
            this.shown_contact_id = id;
        }
        var s = this._show_contacts(id, flag);
        this.applet.script_callback( s, { maintain_selection: true, try_catch: true }, callback );
    },
    consurf_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "consurf",
        "color": "tomato",
        "label": "contact surface"
    }),
    intersurf_cell: Provi.Bio.AtomSelection.CellFactory({
        "name": "intersurf",
        "color": "skyblue",
        "label": "element surface"
    }),
    contacts_cell: function(id, contacts){
        // if( id==="all" ) return '';

        var $contacts = $('<span style="background:lightgreen; float:right; width:22px;">' +
            '<input cell="contacts" type="radio" ' + 
                ( contacts ? 'checked="checked" ' : '' ) + 
            '/>' +
        '</span>');
        $contacts.children().data( 'id', id );

        if( !contacts && id!=='all' ){
            var tt = 'Show contacts';
            $contacts.tipsy({gravity: 'n', fallback: tt});
        }else if( !contacts && id==='all' ){
            var tt = 'Hide all contacts';
            $contacts.tipsy({gravity: 'n', fallback: tt});
        }
        
        return $contacts;
    }
    // selection: function(id, flag){
    //     if( _.include([ 'Membrane', 'Water' ], id ) ){
    //         ''
    //     }else{
    //         return Provi.Bio.AtomSelection.VariableSelectionType.selection.call(this, id, flag);
    //     }
    // },
});



})();