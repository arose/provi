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



/**
 * @constructor Represents interface contacts from sco and mbn files
 * @param atoms { cutoff: [atom] } A dictionary containing a list of atoms for different cutoff values
 * @param names [name] A list of available interface names
 */
Provi.Bio.InterfaceContacts.Contacts = function(atoms, names){
    this.atoms = atoms;
    this.names = names;
};
Provi.Bio.InterfaceContacts.Contacts.prototype = /** @lends Provi.Bio.InterfaceContacts.Contacts.prototype */ {
    get_atoms: function( names, cutoff ){
        try{
            return this.atoms[ names ][ cutoff ];
        }catch(err){
            return false;
        }
    }
};


/**
 * A widget to view interface contacts from sco and mbn data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 */
Provi.Bio.InterfaceContacts.InterfaceContactsWidget = function(params){
    this.applet = params.applet;
    this.dataset = params.dataset;
    params = $.extend(
        Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype.default_params,
        params
    );
    this.color = params.color;
    this.cutoff = params.cutoff;
    this.show_only_interface_atoms = params.show_only_interface_atoms;
    this.color_interface_residue = params.color_interface_residue;
    this.autofocus = params.autofocus;
    this.interface_ids = '';
    this.interface_names = '';
    this.tmh_filter = false;
    this.tmh_list = false;
    this.atoms = [];
    this.structure_atoms = [];
    
    Widget.call( this, params );
    this._build_element_ids([ 'interface_name', 'cutoff', 'show_only_interface_atoms', 'color_interface_residue', 'tmh_filter_check', 'autofocus' ]);
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="' + this.interface_name_id + '">interface contacts for</label>&nbsp;' +
            '<select id="' + this.interface_name_id + '" class="ui-state-default">' +
                '<option title="group" value="">none</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.cutoff_id + '">interface contact cutoff</label>&nbsp;' +
            '<select id="' + this.cutoff_id + '" class="ui-state-default">' +
                '<option value="2.8">2.8</option>' +
                '<option value="2.5">2.5</option>' +
                '<option value="2.0">2.0</option>' +
                '<option value="1.5" selected="selected">1.5</option>' +
                '<option value="1.0">1.0</option>' +
                '<option value="0.5">0.5</option>' +
                '<option value="0.0">0.0</option>' +
                '<option value="-0.5">-0.5</option>' +
            '</select>&nbsp;&#8491;' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.autofocus_id + '" type="checkbox" />' +
            '<label for="' + this.autofocus_id + '">autofocus</label>&nbsp;' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.show_only_interface_atoms_id + '" type="checkbox" />' +
            '<label for="' + this.show_only_interface_atoms_id + '">show only interface atoms/residues</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.color_interface_residue_id + '" type="checkbox" />' +
            '<label for="' + this.color_interface_residue_id + '">color the complete residue (not only the contact making atom)</label>' +
        '</div>' +
        '<div class="control_row">' +
            '<input id="' + this.tmh_filter_check_id + '" type="checkbox" />' +
            '<label for="' + this.tmh_filter_check_id + '">limit interface contacts to tmh atoms</label>&nbsp;' +
        '</div>' +
        '<i>interface atoms are shown in orange</i>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype */ {
    default_params: {
        color: 'orange',
        cutoff: 1.5,
        show_only_interface_atoms: false,
        color_interface_residue: false,
        autofocus: true
    },
    _init: function(){
        var self = this;
        $(Provi.Data.DatasetManager).bind('change', function(){ self._init_tmh_filter() });
        
        if(this.dataset.type == 'mbn'){
            this.interface_names = 'Membrane';
        }else{
            this.interface_names = 'Helices';
        }
        $("#" + this.interface_name_id).val( this.interface_names );
        
        $(this.dataset).bind('change', function(){ self._init_control });
        this._init_control();
        this.retrieve_atoms();
        
        $("#" + this.cutoff_id).change( function() {
            self.cutoff = $("#" + self.cutoff_id + " option:selected").val();
            //console.log( self.cutoff );
            self.retrieve_atoms();
        });
        $("#" + this.interface_name_id).change( function() {
            self.interface_names = $("#" + self.interface_name_id + " option:selected").val();
            self.retrieve_atoms();
        });
        
        $("#" + self.autofocus_id).attr('checked', self.autofocus);
        $("#" + self.autofocus_id).bind('change click', function(){
            self.autofocus = $("#" + self.autofocus_id).is(':checked');
            if( self.autofocus ){
                self.draw();
            }else{
                // remove focus???
                self.applet.script( 'center {*};', true );
            }
        });
        
        $("#" + self.color_interface_residue_id).bind('change click', function(){
            self.color_interface_residue = $("#" + self.color_interface_residue_id).is(':checked');
            self.draw();
        });
        $("#" + self.show_only_interface_atoms_id).bind('change click', function(){
            self.show_only_interface_atoms = $("#" + self.show_only_interface_atoms_id).is(':checked');
            self.draw();
        });
        this._init_tmh_filter();
        $("#" + this.tmh_filter_check_id).change( function() {
            self.tmh_filter = $("#" + self.tmh_filter_check_id).is(':checked');
            self.draw();
        });
        
        this.interface_contacts_selection = new Provi.Selection.Selection({
            persist: true,
            applet: this.applet,
            name: 'Current Interface Contacts [' + this.dataset.id + ']',
            selection: ''
        });
        
        this.structure_selection = new Provi.Selection.Selection({
            persist: true,
            applet: this.applet,
            name: 'Current Interface Structure [' + this.dataset.id + ']',
            selection: ''
        });
        
        Widget.prototype.init.call(this);
    },
    _init_control: function(){
        var self = this;
        if( this.dataset.data.names ){
            var data = this.dataset.data.names;
            data.sort();
            type_count = {};
            type_names = {
                'H': 'Helix',
                'C': 'Coil',
                'E': 'Sheet',
                'W': 'Water',
                'O': 'Hetero'
            }
            $.each(data, function(i){
                //console.log( this, parseInt(this[1]+''), /[0-9]/.test(this[1]), this[1], this.charAt(1) );
                type_count[ this.charAt(0) ] = type_count[ this.charAt(0) ] ? type_count[ this.charAt(0) ] + 1 : 1;
                var label = this;
                var selected = "";
                if( self.interface_names == this ){
                    selected = ' selected="selected" ';
                }
                if( type_names[ this.charAt(0) ] && /[0-9]/.test(this.charAt(1)) ){
                    label = type_names[ this.charAt(0) ] + ' ' + type_count[ this.charAt(0) ] + ' (' + this + ')';
                    $("#" + self.interface_name_id).append(
                        "<option " + selected + " value='" + this + "'>" + label + "</option>"
                    );
                }else{
                    $("#" + self.interface_name_id).children('[title=group]').last().after(
                        "<option " + selected + " title='group' value='" + this + "'>" + label + "</option>"
                    );
                }
            });
            $("#" + this.interface_name_id).chosen();
        }
    },
    /** initialize the tmh filter controls */
    _init_tmh_filter: function(){
        var self = this;
        $.each( Provi.Data.DatasetManager.get_list(), function(i, dataset){
            $("#" + self.tmh_filter_check_id).parent().hide();
            if( dataset.type == 'tmhelix' && dataset.data && Utils.in_array(dataset.applet_list, self.applet) ){
                self.tmh_list = dataset.data.tmh_list;
                self.tmh_filter = false;
                $("#" + self.tmh_filter_check_id).parent().show();
                return false;
            }else{
                return true;
            }
        });
    },
    retrieve_atoms: function (){
        this.block();
        this.applet.echo( 'loading...' );
        if(this.interface_names){
            var self = this;
            this.dataset.get_atoms( this.interface_ids, this.interface_names, this.cutoff, function( interface_data, structure_data ){
                self.atoms = interface_data;
                self.structure_atoms = structure_data;
                self.draw();
                self.unblock();
                self.applet.echo();
            });
        }else{
            this.atoms = [];
            this.structure_atoms = [];
            this.draw();
            this.unblock();
            this.applet.echo();
        }
    },
    draw: function(){
        this.block();
        this.applet.echo( 'loading...' );
        //this._draw1();
        //this._draw2();
        //this._draw3();
        this._draw4();
        //this._draw5();
        this.unblock();
        this.applet.echo();
    },
    _draw1: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw1 by_chain'});
            
            timer.start();
            var atoms_by_chains = {}
            $.each(this.atoms, function(i,atom){
                if( !atoms_by_chains[atom.chainId] ){
                    atoms_by_chains[atom.chainId] = [];
                }
                atoms_by_chains[atom.chainId].push(
                    atom.asNr + "." + atom.atomName
                );
            });
            var atoms2 = [];
            $.each(atoms_by_chains, function(chain, atoms){
                atoms2.push(
                    '( chain="' + chain + '" and (' + atoms.join(',') + ') )'
                );
            });
            atoms2 = atoms2.join(' or ');
            timer.stop();
            atoms = atoms2;
            
            if( this.tmh_filter && this.tmh_list ){
                console.log( this.tmh_list );
                var tmh_filter = []
                $.each( this.tmh_list, function( i, tmh ){
                    tmh_filter.push(
                        '(' + ( tmh[0][0] ? ('chain = "' + tmh[0][0] + '" and ') : '' ) + 'resno >= ' + tmh[0][1] + ' and resno <= ' + tmh[1][1] + ')'
                    );
                });
                atoms = '( (' + atoms + ') ) and (' + tmh_filter.join( ' or ' ) + ')';
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            cmd += '' +
                'var dist = {selected}.distance({selected});' +
                'print @dist;' +
                'set rotationRadius @{dist*2};' +
                'slab on; set slabRange @{dist/1};' +
                'set zShade on; set zSlab @{dist*0.6};' +
                'set zDepth @{dist*0.1}; ' +
                '';
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd + ' zoom (selected) 100; select none;');
            timer.stop();
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
    },
    _draw2: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw2 res:chain:atom'});
            timer.start();
            var atoms = $.map(this.atoms, function(atom){
                return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
            });
            atoms = atoms.join(',');
            timer.stop();
            
            if( this.tmh_filter && this.tmh_list ){
                console.log( this.tmh_list );
                var tmh_filter = []
                $.each( this.tmh_list, function( i, tmh ){
                    tmh_filter.push(
                        '(' + ( tmh[0][0] ? ('chain = "' + tmh[0][0] + '" and ') : '' ) + 'resno >= ' + tmh[0][1] + ' and resno <= ' + tmh[1][1] + ')'
                    );
                });
                atoms = '( (' + atoms + ') ) and (' + tmh_filter.join( ' or ' ) + ')';
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            cmd += '' +
                'var dist = {selected}.distance({selected});' +
                'print @dist;' +
                'set rotationRadius @{dist*2};' +
                'slab on; set slabRange @{dist/1};' +
                'set zShade on; set zSlab @{dist*0.6};' +
                'set zDepth @{dist*0.1}; ' +
                '';
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd + ' zoom (selected) 100; select none;');
            timer.stop();
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
    },
    _draw3: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw3 atomNr'});
            timer.start();
            var atoms = $.map(this.atoms, function(atom){
                return 'atomno='+ atom.atomNr;
            });
            atoms = '(' + atoms.join(',') + ')';
            timer.stop();
            
            //console.log( atoms );
            
            if( this.tmh_filter && this.tmh_list ){
                console.log( this.tmh_list );
                var tmh_filter = []
                $.each( this.tmh_list, function( i, tmh ){
                    tmh_filter.push(
                        '(' + ( tmh[0][0] ? ('chain = "' + tmh[0][0] + '" and ') : '' ) + 'resno >= ' + tmh[0][1] + ' and resno <= ' + tmh[1][1] + ')'
                    );
                });
                atoms = '( (' + atoms + ') ) and (' + tmh_filter.join( ' or ' ) + ')';
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            cmd += '' +
                'var dist = {selected}.distance({selected});' +
                'print @dist;' +
                'set rotationRadius @{dist*2};' +
                'slab on; set slabRange @{dist/1};' +
                'set zShade on; set zSlab @{dist*0.6};' +
                'set zDepth @{dist*0.1}; ' +
                '';
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd + ' zoom (selected) 100; select none;');
            timer.stop();
        }else{
            var cmd = 'display all; select all; center {all}; color grey; slab off;';
            this.applet.script( cmd );
        }
    },
    _draw4: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw4 atomNr/atomID range'});
            timer.start();
            var atoms = [];
            var a_start = -10;
            var a_prev = -10;
            $.each(this.atoms, function(i, atom){
                var a = parseInt( atom.atomNr );
                //console.log(a_prev, a, a-1);
                if(a-1 > a_prev){
                    //console.log( 'run break' );
                    if(a_start > 0){
                        atoms.push([a_start,a_prev]);
                    }
                    a_start = a;
                }
                a_prev = atom.atomNr;
            });
            atoms.push([a_start,a_prev]);
            //console.log( atoms );
            var atoms = $.map(atoms, function(atom){
                if( atom[0] == atom[1] ){
                    return 'atomno=' + atom[0] + '';
                }else{
                    return 'atomno>=' + atom[0] + '&atomno<=' + atom[1] + '';
                }
            });
            atoms = '(' + atoms.join(',') + ')';
            timer.stop();
            
            //console.log( atoms );
            
            if( this.tmh_filter && this.tmh_list ){
                console.log( this.tmh_list );
                var tmh_filter = []
                $.each( this.tmh_list, function( i, tmh ){
                    tmh_filter.push(
                        '(' + ( tmh[0][0] ? ('chain = "' + tmh[0][0] + '" and ') : '' ) + 'resno >= ' + tmh[0][1] + ' and resno <= ' + tmh[1][1] + ')'
                    );
                });
                atoms = '( (' + atoms + ') ) and (' + tmh_filter.join( ' or ' ) + ')';
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            //cmd += ' select {@IATOMS or @SATOMS};';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            if( this.autofocus ){
                cmd += '' +
                    'var dist = {selected}.distance({selected});' +
                    'set rotationRadius @{dist*2};' +
                    'set zShade on; set zSlab @{dist*0.6};' +
                    'set zDepth @{dist*0.1}; ' +
                    'zoom (selected) 100; ' +
                    'set slabEnabled true; slab 100; depth 0;' +
                    // not needed, rotationRadius plus slab/depth take care
                    //'set slabRange @{dist/1};' +
                    '';
            }
                
            //console.log( cmd );
            timer.start();
            this.applet.script_wait(cmd, true);
            this.applet.lighting_manager.sync();
            this.applet.clipping_manager.sync();
            timer.stop();
        }else{
            var cmd = 'display all; select all; color grey;';
            if( this.autofocus ){
                cmd += 'zoom (*) 100; center {*}; slab off;';
            }
            this.applet.script_wait( cmd, true );
            this.applet.clipping_manager.sync();
        }
    },
    _draw5: function(){
        if(this.atoms && this.atoms.length){
            var timer = new Provi.Debug.timer({name:'draw5 atomNr range short syntax'});
            timer.start();
            var atoms = [];
            var a_start = -10;
            var a_prev = -10;
            $.each(this.atoms, function(i, atom){
                var a = parseInt( atom.atomNr );
                //console.log(a_prev, a, a-1);
                if(a-1 > a_prev){
                    //console.log( 'run break' );
                    if(a_start > 0){
                        atoms.push([a_start,a_prev]);
                    }
                    a_start = a;
                }
                a_prev = atom.atomNr;
            });
            atoms.push([a_start,a_prev]);
            //console.log( atoms );
            var atoms = $.map(atoms, function(atom){
                if( atom[0] == atom[1] ){
                    return (atom[0]-1) + '';
                }else{
                    return (atom[0]-1) + ':' + (atom[1]-1);
                }
            });
            atoms = '({' + atoms.join(' ') + '})';
            timer.stop();
            
            //console.log( atoms );
            
            if( this.tmh_filter && this.tmh_list ){
                console.log( this.tmh_list );
                var tmh_filter = []
                $.each( this.tmh_list, function( i, tmh ){
                    tmh_filter.push(
                        '(' + ( tmh[0][0] ? ('chain = "' + tmh[0][0] + '" and ') : '' ) + 'resno >= ' + tmh[0][1] + ' and resno <= ' + tmh[1][1] + ')'
                    );
                });
                atoms = '( (' + atoms + ') ) and (' + tmh_filter.join( ' or ' ) + ')';
            }
            
            this.interface_contacts_selection.selection = '(' + atoms + ')';
            
            var structure_atoms = [];
            if(this.structure_atoms && this.structure_atoms.length){
                structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
            }
            structure_atoms = structure_atoms.join(',');
            structure_atoms = structure_atoms ? structure_atoms : 'none';
            this.structure_selection.selection = '(' + structure_atoms + ')';
            
            var cmd = 'var IATOMS = {(' + atoms + ')}; ' +
                'var SATOMS = {(' + structure_atoms + ')};';
            
            if(this.color_interface_residue){
                cmd += 'display all; select all; color grey; select within(GROUP, @IATOMS ); color ' + this.color + ';';
            }else{
                cmd += 'display all; select all; color grey; select @IATOMS; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                cmd += ' select @IATOMS or @SATOMS; display selected; ';
            }
            if(this.structure_atoms && this.structure_atoms.length){
                cmd += ' select @SATOMS; color pink; ';
            }
            //cmd += 'slab on; set slabRange 28.0; set zShade on; set zSlab 45; set zDepth 10; ';
            //cmd += ' select {@IATOMS or @SATOMS};';
            cmd += ' select {@IATOMS or @SATOMS}; echo @{ {selected}.length };';
            
            if( this.autofocus ){
                cmd += '' +
                    'var dist = {selected}.distance({selected});' +
                    'set rotationRadius @{dist*2};' +
                    'slab on; set slabRange @{dist/1};' +
                    'set zShade on; set zSlab @{dist*0.6};' +
                    'set zDepth @{dist*0.1}; ' +
                    'zoom (selected) 100; ' +
                    '';
            }
                
            //console.log( cmd );
            timer.start();
            this.applet.script(cmd, true);
            this.applet.lighting_manager.sync();
            this.applet.clipping_manager.sync();
            timer.stop();
        }else{
            var cmd = 'display all; select all; color grey;';
            if( this.autofocus ){
                cmd += 'zoom (*) 100; center {*}; slab off;';
            }
            this.applet.script( cmd, true );
            this.applet.clipping_manager.sync();
        }
    }
});

})();