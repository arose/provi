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
    this.color = 'orange';
    this.cutoff = 1.5;
    this.show_only_interface_atoms = false;
    this.color_interface_residue = false;
    this.interface_ids = '';
    this.interface_names = '';
    this.tmh_filter = false;
    this.tmh_list = false;
    this.atoms = [];
    this.structure_atoms = [];
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this._build_element_ids([ 'interface_name', 'cutoff', 'show_only_interface_atoms', 'color_interface_residue', 'tmh_filter_check' ]);
    
    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<span>Dataset: ' + this.dataset.name + '</span>&nbsp;|&nbsp;' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.interface_name_id + '">interface contacts for</label>' +
            '<select id="' + this.interface_name_id + '" class="ui-state-default">' +
                '<option value="">none</option>' +
                '<option value="helix">all helices</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.cutoff_id + '">interface contact cutoff</label>' +
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
    console.log(content);
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.InterfaceContacts.InterfaceContactsWidget.prototype */ {
    _init: function(){
        var self = this;
        $(Provi.Data.DatasetManager).bind('change', function(){ self._init_tmh_filter() });
        
        if(this.dataset.type == 'mbn'){
            $("#" + this.interface_name_id + ' option[value=]').after("<option value='membrane' selected='selected'>membrane</option>");
            this.interface_names = 'membrane';
        }else{
            this.interface_names = 'helix';
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
    },
    _init_control: function(){
        var self = this;
        if( this.dataset.data.names ){
            var data = this.dataset.data.names;
            data.sort();
            $.each(data, function(i){
                $("#" + self.interface_name_id).append("<option value='" + this + "'>helix " + (i+1) + "</option>");
            });
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
        if(this.interface_names){
            var self = this;
            this.dataset.get_atoms( this.interface_ids, this.interface_names, this.cutoff, function( interface_data, structure_data ){
                self.atoms = interface_data;
                self.structure_atoms = structure_data;
                self.draw();
            });
        }else{
            this.atoms = [];
            this.structure_atoms = [];
            this.draw();
        }
    },
    draw: function(){
        if(this.atoms && this.atoms.length){
            var atoms = $.map(this.atoms, function(atom){
                return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
            });
            atoms = atoms.join(',');
            
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
            
            if(this.color_interface_residue){
                var cmd = 'display all; select all; color grey; select within(GROUP, (' + atoms + ') ); save selection MINTERF; color ' + this.color + ';';
            }else{
                var cmd = 'display all; select all; color grey; select (' + atoms + '); save selection MINTERF; color ' + this.color + ';';
            }
            
            if(this.show_only_interface_atoms){
                //cmd = cmd + ' restore selection MINTERF; display selected;';
                cmd = cmd + ' display selected; zoom(selected) 100;';
            }else if(this.structure_atoms && this.structure_atoms.length){
                var structure_atoms = $.map(this.structure_atoms, function(atom){
                    return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
                });
                structure_atoms = structure_atoms.join(',');
                cmd = cmd + ' select (' + structure_atoms + '); save selection MSTRUC; color pink; zoom(selected) 100;';
            }
        }else{
            var cmd = 'display all; select all; color grey;';
        }
        
        this.applet.script(cmd + ' select none;');
    }
});

})();