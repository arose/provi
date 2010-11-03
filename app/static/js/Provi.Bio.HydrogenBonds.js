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
};
Provi.Bio.HydrogenBonds.Hbonds.prototype = /** @lends Provi.Bio.HydrogenBonds.Hbonds.prototype */ {
    
};


/**
 * A widget to view hydrogen bonds data
 * @constructor
 * @extends Provi.Widget.Widget
 * @param {object} params Configuration object, see also {@link Provi.Widget.Widget}.
 * @param {Provi.Jmol.Applet} params.applet The applet the widget will be bound to
 * @param {Provi.Data.Dataset} params.dataset The dataset the widget will be bond to
 */
Provi.Bio.HydrogenBonds.HbondsWidget = function(params){
    /** Color in which the hydrogen bonds are drawn */
    this.color = 'blue';
    this.show_hbonds = '';
    this.applet = params.applet;
    this.dataset = params.dataset;
    Widget.call( this, params );
    this.canvas_id = this.id + '_canvas';
    this.draw_id = this.id + '_draw';
    this.draw_tree_id = this.id + '_draw_tree';
    this.show_hbonds_check_id = this.id + '_show_hbonds_check';
    this.show_hbonds_select_id = this.id + '_show_hbonds_select';

    var content = '<div class="control_group">' +
        '<div class="control_row">' +
            '<span>Dataset: ' + this.dataset.name + '</span>&nbsp;|&nbsp;' +
            '<span>Applet: ' + this.applet.name_suffix + '</span>' +
        '</div>' +
        '<div class="control_row">' +
            '<label for="' + this.show_hbonds_check_id + '">show hydrogen bonds</label>&nbsp;' +
            '<input id="' + this.show_hbonds_check_id + '" type="checkbox" />' +
            '<select id="' + this.show_hbonds_select_id + '" class="ui-state-default">' +
                '<option value="" selected="selected">none</option>' +
                '<option value="all">all available</option>' +
                '<option value="interhelical">interhelical</option>' +
            '</select>' +
        '</div>' +
        //'<div class="control_row">' +
        //    '<i>the hydrogen bonds are shown in blue; residues donor and acceptor atoms are light green</i>' +
        //'</div>' +
        //'<div class="control_row">' +
        //    '<button id="' + this.draw_id + '">draw</button>' +
        //    '<button id="' + this.draw_tree_id + '">draw tree</button>' +
        //'</div>' +
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
            console.log(self.show_hbonds);
            self.update();
        });
        $("#" + this.show_hbonds_select_id).change( function() {
            self.show_hbonds = $("#" + self.show_hbonds_select_id + " option:selected").val();
            self.update();
        });
        this._init_control();
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
                return false;
            }else{
                $("#" + self.show_hbonds_select_id).hide();
                $("#" + self.show_hbonds_check_id).show();
                return true;
            }
        });
    },
    /** update all widget components */
    update: function(){
        this.draw();
        this.draw_tree();
    },
    /** draw the hbond in the applet */
    draw: function(){
        if( !this.applet ) return;
        var hbonds = this.get_hbonds();
        this.applet.script( 'draw hbond_' + this.id + '* off' );
        if(hbonds){
            var self = this;
            var draw_hbonds = '';
            var i = 0;
            $.each(hbonds, function(){
                draw_hbonds += 'draw hbond_' + self.id + '_all' + i + ' color ' + self.color + ' (' + this[0][3] + (this[0][2] ? ':' + this[0][2] : '') + '.' + $.trim(this[0][0]) + ') (' + this[1][3] + (this[1][2]? ':' + this[1][2] : '') + '.' + $.trim(this[1][0]) + ');';
                //draw_hbonds += 'select ' + this[0][3] + ':' + this[0][2] + ',' + this[1][3] + ':' + this[1][2] + '; color lightgreen; cartoon ONLY; wireframe 0.1;';
                i = i+1;
            });
            this.applet.script( draw_hbonds );
        }else{
            this.applet.script( 'draw hbond_' + this.id + '* off' );
        }
    },
    /** draw the tree listing all hbonds */
    draw_tree: function(){
        var self = this;
        
        var raw_data = this.get_hbonds();
        //if( !raw_data ) return;
        if( !raw_data ) raw_data = [];
        
        var hbonds = {};
        $.each( raw_data, function(){
            var hb = this;
            var chain = hbonds[ hb[0][2] ];
            if( !chain ){
                chain = hbonds[ hb[0][2] ] = {};
            }
            chain[ hb[0][3] + ':' + hb[0][2] + '.' + $.trim(hb[0][0]) + ' <> ' + hb[1][3] + ':' + hb[1][2] + '.' + $.trim(hb[1][0]) ] = 'Type: ' + hb[2] + '';
        })
        
        var root = pv.dom( hbonds )
            .root( 'Protein' );
        
        /* Recursively compute the package sizes. */
        root.visitAfter(function(node, depth) {
            if (node.firstChild) {
                if( depth == 1){
                    node.nodeValue = node.childNodes.length + " Hbonds";
                }if( depth == 0){
                    node.nodeValue = node.childNodes.length + " Chains";
                }
            }
        });
        
        var vis = new pv.Panel()
            .canvas( this.canvas_id )
            .width(260)
            .height(function(){ return (root.nodes().length + 1) * 12 })
            .margin(5);
        
        var layout = vis.add(pv.Layout.Indent)
            .nodes(function(){ return root.nodes() })
            .depth(12)
            .breadth(12);
        
        layout.link.add(pv.Line);
        
        var node = layout.node.add(pv.Panel)
            .top(function(n){ return n.y - 6 })
            .height(12)
            .right(6)
            .strokeStyle(null)
            .fillStyle(null)
            .events("all")
            .event("mousedown", toggle_node)
            .event("mouseup", select_hbond);
        
        node.anchor("left").add(pv.Dot)
            .strokeStyle("#1f77b4")
            .fillStyle(function(n){ return n.toggled ? "#1f77b4" : n.firstChild ? "#aec7e8" : "#ff7f0e" })
            .title(function t(d){ return d.parentNode ? (t(d.parentNode) + "." + d.nodeName) : d.nodeName })
          .anchor("right").add(pv.Label)
            .text(function(n){ return n.nodeName });
        
        node.anchor("right").add(pv.Label)
            .textStyle(function(n){ return n.firstChild || n.toggled ? "#aaa" : "#000" })
            .text(function(n){ return n.nodeValue || ''; });
        
        root.visitAfter(function(node, depth){
            if(depth > 0){
                node.toggle();
            }
        });
        
        vis.render();
        
        function toggle_node(n){
            n.toggle(pv.event.altKey);
            return layout.reset().root;
        }
        
        function select_hbond(n) {
            if( self.applet && n.childNodes.length == 0 && n.parentNode ){
                var hb_res = n.nodeName.split(' <> ');
                self.applet.selection_manager.select(hb_res[0] + ' or ' + hb_res[1]);
            }
        }
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
    }
});


})();