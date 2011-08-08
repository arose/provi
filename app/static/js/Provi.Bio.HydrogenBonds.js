/**
 * @fileOverview This file contains the {@link Provi.Bio.HydrogenBonds} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * Module providing functionality around Hydrogen bonds
 * @namespace 
 */
Provi.Bio.HydrogenBonds = {};

(function() {

var Utils = Provi.Utils;
var Widget = Provi.Widget.Widget;


/**
 * Represents hydrogen bonds
 * @constructor
 */
Provi.Bio.HydrogenBonds.Hbonds = function(hbonds_list){
    this.hbonds_list = hbonds_list;
    this.init();
};
Provi.Bio.HydrogenBonds.Hbonds.prototype = Provi.Utils.extend(Provi.Bio.Smcra.AbstractAtomPropertyMap, /** @lends Provi.Bio.HydrogenBonds.Hbonds.prototype */ {
    key_length: 2,
    init: function(){
	console.log( 'HBX', this );
	var self = this;
	this.property_dict = {};
	this.property_list = [];
	this._keys = [];
	$.each( this.hbonds_list, function(i, hb){
	    var property = {
		atom1: { resno: hb[0][3], chain: hb[0][2], atom_name: $.trim(hb[0][0]) },
		atom2: { resno: hb[1][3], chain: hb[1][2], atom_name: $.trim(hb[1][0]) },
		type: hb[2],
		sele: '(' + hb[0][3] + ':' + hb[0][2] + '.' + $.trim(hb[0][0]) + ' OR ' +
		    hb[1][3] + ':' + hb[1][2] + '.' + $.trim(hb[1][0]) + ')'
	    }
	    var key1 = [ hb[0][2], hb[0][3], $.trim(hb[0][0]) ];
	    var key2 = [ hb[1][2], hb[1][3], $.trim(hb[1][0]) ];
	    var key = [ key1, key2 ];
	    self._keys.push( key );
	    self.property_dict[ key ] = property;
	    self.property_list.push( property );
	});
    },
    _get: function(id){
	//console.log('ID', id );
	return this.property_dict[ id ];
    },
    _cmp_id: function(id, own_id){
	var len = id.length;
	return Provi.Utils.array_cmp( id, own_id[0].slice(0, len) ) ||
	    Provi.Utils.array_cmp( id, own_id[1].slice(0, len) );
    }
});


/**
 * A widget to view hydrogen bonds data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 * @param {Provi.Jmol.Applet} params.applet The applet the widget will be bound to
 * @param {Provi.Data.Dataset} params.dataset The dataset the widget will be bond to
 */
Provi.Bio.HydrogenBonds.HbondsWidget = function(params){
    params = $.extend(
        Provi.Bio.HydrogenBonds.HbondsWidget.prototype.default_params,
        params
    );
    /** Color in which the hydrogen bonds are drawn */
    this.color = 'blue';
    this.hb_atomno_dict = {};
    this.show_hbonds = '';
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.draw_id = this.id + '_draw';
    this.draw_tree_id = this.id + '_draw_tree';
    this.show_hbonds_check_id = this.id + '_show_hbonds_check';
    this.show_hbonds_select_id = this.id + '_show_hbonds_select';
    this.jstree_id = this.id + '_jstree';

    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<label for="' + this.show_hbonds_check_id + '">show hydrogen bonds</label>&nbsp;' +
            '<input id="' + this.show_hbonds_check_id + '" type="checkbox" />' +
            '<select id="' + this.show_hbonds_select_id + '" class="ui-state-default">' +
                '<option value="" selected="selected">none</option>' +
                '<option value="all">all available</option>' +
                '<option value="interhelical">interhelical</option>' +
            '</select>' +
        '</div>' +
        '<div class="control_row">' +
            '<i>The hydrogen bonds are shown as blue dashed lines.</i>' +
        '</div>' +
        //'<div class="control_row">' +
        //    '<button id="' + this.draw_id + '">draw</button>' +
        //    '<button id="' + this.draw_tree_id + '">draw tree</button>' +
        //'</div>' +
	'<div class="control_row">' +
            '<div id="' + this.jstree_id + '"></div>' +
        '</div>' +
	'<div class="control_row">' +
            '<div id="' + this.canvas_id + '" style="width:300px; overflow:auto;"></div>' +
        '</div>' +
    '</div>';
    $(this.dom).append( content );
    this._init();
}
Provi.Bio.HydrogenBonds.HbondsWidget.prototype = Utils.extend(Widget, /** @lends Provi.Bio.HydrogenBonds.HbondsWidget.prototype */ {
    /** initialisation */
    _init: function(){
        var self = this;
        $(Provi.Data.DatasetManager).bind('change', function(){ self._init_control() });
        this.update();
        $("#" + this.draw_id).button().click(function() {
            self.draw();
        });
        $("#" + this.draw_tree_id).button().click(function() {
            self.draw_tree();
        });
        this._init_control();
        $("#" + this.show_hbonds_select_id).hide();
        $("#" + this.show_hbonds_check_id).change( function() {
            self.show_hbonds = $("#" + self.show_hbonds_check_id).is(':checked');
            self.update();
        });
        $("#" + this.show_hbonds_select_id).change( function() {
            self.show_hbonds = $("#" + self.show_hbonds_select_id + " option:selected").val();
            self.update();
        });
        this._init_control();
	$(this.applet.selection_manager).bind('select', $.proxy(this.select, this));
	Widget.prototype.init.call(this);
    },
    /** initialize the controls */
    _init_control: function(){
        var self = this;
        $.each( Provi.Data.DatasetManager.get_list(), function(){
            if(this.type == 'tmhelix' && this.data){
                //console.log(this);
                self.tmh_dataset = this;
                self.show_hbonds = self.show_hbonds ? 'all' : '';
                //self.show_hbonds = 'interhelical'
                $("#" + self.show_hbonds_select_id).val( self.show_hbonds );
                self.update();
                $("#" + self.show_hbonds_select_id).show();
                $("#" + self.show_hbonds_check_id).hide();
		$("#" + self.show_hbonds_check_id).siblings('label').attr('for', self.show_hbonds_select_id);
                return false; // break
            }else{
                $("#" + self.show_hbonds_select_id).hide();
                $("#" + self.show_hbonds_check_id).show();
                return true;
            }
        });
    },
    /** update all widget components */
    update: function(){
	if( this.show_hbonds ){
	    $( '#' + this.jstree_id ).show();
	    this.block();
	    this.applet.echo( 'loading...' );
	    this.draw();
	    this.draw_tree();
	    this.unblock();
	    this.applet.echo();
	}else{
	    this.applet.script( "select all; hbonds delete;", true );
	    $( '#' + this.jstree_id ).hide();
	}
    },
    /** draw the hbond in the applet */
    draw: function(){
        if( !this.applet ) return;
	var timer = new Provi.Debug.timer({name:'hbonds'});
        var hbonds = this.get_hbonds();
	this.applet.script_wait( "select all; hbonds delete;", true );
        if(hbonds){
            var self = this;
	    var hbonds_data = [];
	    var hb_list = [];
	    var hb_connect = '';
	    //timer.start();
            $.each(hbonds, function(){
		var hb1 = this[0][3] + (this[0][2] ? ':' + this[0][2] : '') + '.' + $.trim(this[0][0]);
		var hb2 = this[1][3] + (this[1][2] ? ':' + this[1][2] : '') + '.' + $.trim(this[1][0]);
		//hb_list.push( '"[" + {' + hb1 + '}.atomIndex + "," + {' + hb2 + '}.atomIndex + "]"');
		//if(!self.hb_atomno_dict[hb1]){
		//    self.hb_atomno_dict[hb1] = self.applet.evaluate("{" + hb1 + "}.atomIndex");
		//}
		//if(!self.hb_atomno_dict[hb2]){
		//    self.hb_atomno_dict[hb2] = self.applet.evaluate("{" + hb2 + "}.atomIndex");
		//}
		//hb_connect += 'connect ({' + self.hb_atomno_dict[hb1] + '}) ({' + self.hb_atomno_dict[hb2] + '}) HBOND; ';
		hbonds_data += hb1 + '\n' + hb2 + '\n';
            });
	    //timer.stop();
	    //
	    //timer.start();
	    //var hbl = eval( this.applet.evaluate( '"[" + ' + hb_list.join(' + "," + ') + ' + "]"' ) );
	    //console.log( hbl );
	    
	    //this.applet.script_wait( hb_connect + 'select all; color HBONDS ' + this.color + '; hbonds 0.1; ', true );
	    //timer.stop();
	    var hb = '' +
		'set refreshing false;' +
		'var hb_list = "' + hbonds_data + '".split("\n"); var n = hb_list.length-1;' +
		'for(var i=1; i<n; i+=2){' +
		    'connect {@hb_list[i]} {@hb_list[i+1]} HBOND; ' +
		'}' +
		'select all; color HBONDS ' + this.color + '; hbonds 0.1; ' +
		//'select within(GROUP, connected(HBONDS)); wireframe 0.01;' +
		'set refreshing true;' +
		'';
	    this.applet.script_wait( hb, true );
        }else{
	    this.applet.script( "select all; hbonds delete;", true );
        }
    },
    /** draw the tree listing all hbonds */
    draw_tree: function(){
        var self = this;
        
        var raw_data = this.get_hbonds();
        if( !raw_data ) return;
        if( !raw_data ) raw_data = [];
        
	var jstree_data = [];
	var jstree_data_by_chain = {};
        $.each( raw_data, function(){
	    var hb = this;
	    var key1 = [ hb[0][2], hb[0][3], $.trim(hb[0][0]) ];
	    var key2 = [ hb[1][2], hb[1][3], $.trim(hb[1][0]) ];
	    var key = [ key1, key2 ];
	    var hb_node = {
		//data: hb[0][3] + ':' + hb[0][2] + '.' + $.trim(hb[0][0]) + ' <> ' + hb[1][3] + ':' + hb[1][2] + '.' + $.trim(hb[1][0]) + ' (Type: ' + hb[2] + ')',
		data: hb[0][3] + ':' + hb[0][2] + '.' + $.trim(hb[0][0]) + ' <> ' + hb[1][3] + ':' + hb[1][2] + '.' + $.trim(hb[1][0]),
		metadata: {
		    hb: hb,
		    type: 'hb',
		    hb_id: key
		}
	    };
	    var chain_a = hb[0][2];
	    var chain_b = hb[1][2];
	    var chain_list = (chain_a==chain_b) ? [chain_a] : [chain_a, chain_b];
	    $.each(chain_list, function(i,chain){
		if( !jstree_data_by_chain[chain] ){
		    jstree_data_by_chain[chain] = {
			"data" : "Chain " + chain,
			"children" : [],
			metadata: {
			    type: 'chain',
			    hb_id: [chain]
			}
		    }
		}
		jstree_data_by_chain[chain]['children'].push( hb_node );
	    });
        });
        $.each( jstree_data_by_chain, function(){
	    jstree_data.push( this );
	});
	
	
	console.log( jstree_data );
	$( '#' + this.jstree_id ).jstree({
	    json_data: {
		data: {
                    data : "Protein",
                    children : jstree_data,
		    metadata: {
			type: "protein"
		    }
                },
		progressive_render: true
	    },
	    core: {
		html_titles: false,
		animation: 0
	    },
	    themes: {
		icons: false
	    },
	    checkbox_grid: {
		columns: 1
	    },
	    plugins: [ "json_data", "checkbox_grid", "themes" ]
	});
	this.jstree = $.jstree._reference( '#' + this.jstree_id );
	
	$( '#' + this.jstree_id ).bind("check_node.jstree uncheck_node.jstree", function(event, data){
	    self.__tree_trigger_selection_update(event, data);
	});
    },
    __tree_trigger_selection_update: function(event, data){
	var self = this;
	var selected = data.inst.get_checked( -1, data.args[1] );
	var selection_list = [];
	selected.each( function(i, elm){
	    var $elm = $(elm)
	    console.log( $elm.data() );
	    if( $elm.data('type')=='hb' ){
		//selection_list.push( $elm.data('selection') );
		selection_list.push( self.dataset.data.get( $elm.data('hb_id') ).sele );
	    }else if( $elm.data('type')=='chain' ){
		$.each( self.dataset.data.get( $elm.data('hb_id') ), function(i, hb){
		    if(self._hb_interhelical(hb)) selection_list.push( hb.sele );
		});
	    }else if( $elm.data('type')=='protein' ){
		$.each( self.dataset.data.get_dict(), function(i, hb){
		    if(self._hb_interhelical(hb)) selection_list.push( hb.sele );
		});
	    }
	});
	var sele = selection_list.length ? selection_list.join(' OR ') : 'none';
	this._not_listen_select = true;
	this.applet.selection_manager.select( sele );
	this._not_listen_select = false;
    },
    _hb_interhelical: function(hb){
	if( this.show_hbonds == 'interhelical' ){
	    var tmh_a = this.in_which_helix2( hb.atom1 );
	    var tmh_b = this.in_which_helix2( hb.atom2 );
	    if(tmh_a && tmh_b && tmh_a != tmh_b){
		return true;
	    }else{
		return false;
	    }
	}
	return true;
    },
    /**
     * @ private
     * return the helix in which the amino acid is is
     */
    in_which_helix2: function (aa){
        var tmh_list = this.get_helices();
        if( tmh_list ){
            var chain = aa.chain;
            var number = aa.resno;
            var ret = false;
            $.each(tmh_list, function(){
                if(this[0][0] == chain && this[1][0] == chain && this[0][1] <= number && this[1][1] >= number){
                    ret = this;
                    return false; // break
                }
                return true; // continue
            });
            return ret;
        }
        return undefined;
    },
    /**
     * @private
     * get all hbonds that should be shown
     */
    get_hbonds: function(){
        if(this.show_hbonds){
            var self = this;
            var hbonds = this.dataset.data.hbonds_list;
            //console.log( 'helices', this.get_helices() );
            if( this.show_hbonds == 'interhelical' && this.get_helices() ){
                //console.log( this.get_helices() );
                hbonds = $.map(hbonds, function(hb, i){
                    var tmh_a = self.in_which_helix( hb[0] );
                    var tmh_b = self.in_which_helix( hb[1] );
                    if(tmh_a && tmh_b && tmh_a != tmh_b){
                        return [hb];
                    }else{
                        return null;
                    }
                });
            }
            return hbonds;
        }else{
            return false;
        }
    },
    /**
     * @ private
     * return the helix in which the amino acid is is
     */
    in_which_helix: function (aa){
        var tmh_list = this.get_helices();
        if( tmh_list ){
            var chain = aa[2];
            var number = aa[3];
            var ret = false;
            $.each(tmh_list, function(){
                if(this[0][0] == chain && this[1][0] == chain && this[0][1] <= number && this[1][1] >= number){
                    ret = this;
                    return false; // break
                }
                return true; // continue
            });
            return ret;
        }
        return undefined;
    },
    /**
     * @private
     * get transmembrane helices if such a dataset is available
     */
    get_helices: function(){
        if( this.tmh_dataset && this.tmh_dataset.data ){
            return this.tmh_dataset.data.tmh_list;
        }else{
            return false;
        }
    },
    /**
     * @private
     * check if the amino acid is in the current selection
     */
    in_selection: function(d){
	return Utils.in_array(this.selection, d, function(a,b){
	    return a[2]==b[2] && (a[3]==b[3] || !b[3]);
	});
    },
    select: function( selection, applet ){
	console.log('#' + this.jstree_id, this._not_listen_select);
	if( this._not_listen_select || !this.jstree ) return;
	this.jstree.uncheck_all( 1 );
    }
});


})();