/**
 * @fileOverview This file contains the {@link Provi} Module.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */


/**
 * @namespace
 * Provi module
 */
var Provi = {};
var Jmol = {};

(function() {
    
    Provi.defaults = {};
    
    Provi.defaults.dom_parent_ids = {
        DATASET_WIDGET: undefined,
        CANVAS_WIDGET: undefined,
        SELECTION_WIDGET: undefined,
        BUILDER_WIDGET: undefined,
        SETTINGS_WIDGET: undefined,
        JOBS_WIDGET: undefined
    };
    
    Provi.defaults.base_url = '';
    var pathname = window.location.pathname;
    var base_idx = pathname.indexOf("/static/html/");
    if( base_idx>0 ) Provi.defaults.base_url = pathname.substring( 0, base_idx );
    
    Provi.url_for = function( url ){
        return window.location.protocol + '//' + window.location.host + 
            Provi.defaults.base_url + url;
    }

    Provi.layout = function() {
        var n = Provi.Jmol.get_applet_list().length;
        var i = Math.round( Math.sqrt(n) );
        $( Provi.config.dom_ids.main ).layout({
            resize: false, type: 'grid', 
            columns: i, rows: i, vgap: 8, hgap: 8 
        });
    }

    Provi.config = {
        debug: false,
        jquery_ui_css: "../js/lib/jquery-ui/css/smoothness/jquery-ui.css",
        dom_ids: {
            container: "#container",
            main: "#main",
            tabs_panel: "#tabs_panel",
            jmol_window: "#jmolWindow",
            tab_scrollbox: "#tab_scrollbox"
        }
    };

    Provi.init = function(){
        console.log("Provi init");

        var container = $( Provi.config.dom_ids.container );
        var main = $( Provi.config.dom_ids.main );
        var tabs_panel = $( Provi.config.dom_ids.tabs_panel );
        var jmol_window = $( Provi.config.dom_ids.jmol_window );
        var tab_scrollbox = $( Provi.config.dom_ids.tab_scrollbox );

        //
        Provi.Jmol.JmolWidget.prototype.default_params
            .parent_id = Provi.defaults.dom_parent_ids.CANVAS_WIDGET;
        Provi.Jalview.JalviewWidget.prototype.default_params
            .parent_id = Provi.defaults.dom_parent_ids.CANVAS_WIDGET;

        // Jmol & Jalview init
        Provi.Jmol.init(
            "../../jmol/current/63/", !$.query.get('unsigned')
        );
        Provi.Jalview.init(
            "../../jalview/current/0/", !$.query.get('unsigned')
        );

        // ...
        Provi.config.debug = $.query.get('debug');
        Provi.Debug.auto();
        Provi.Utils.event.init();

        // main layout
        Provi.layout();
        $(window).resize( Provi.layout );
        jmol_window.resize( Provi.layout );
        $(Provi.Jmol).bind( 'applet_list_change', Provi.layout );

        // sort widgets
        $(Provi.Widget.WidgetManager).bind('add', function(e, data){
            $('#tab_widgets').children().sortElements( function(a, b){
                var widget_a = Provi.Widget.WidgetManager.get( 
                    $(a).attr('id') 
                );
                var widget_b = Provi.Widget.WidgetManager.get(
                    $(b).attr('id') 
                );
                return widget_a.sort_key < widget_b.sort_key ? -1 : 1;
            });
        });

        // tabs panel config
        tabs_panel.tabs({ cookie: { expires: 30 } });
        tabs_panel.children('ul').removeClass('ui-corner-all');
        tabs_panel.find('a[title]')
            .qtip({ position: {my: 'top center', at: 'bottom center'} });
        tabs_panel.find('a[title]:last')
            .qtip({ position: {my: 'top right', at: 'bottom center'} });
        tabs_panel.find('a[title]:first')
            .qtip({ position: {my: 'top left', at: 'bottom center'} });

        tab_scrollbox.scroll(function (event, ui) {
            $(this).data(
                'scrollTop-tab-' + tabs_panel.tabs('option', 'selected'), 
                $(this).scrollTop()
            );
        });
        
        // only for plupload
        // tabs_panel.bind('tabsshow', function(event, ui) {
        //     var scrollTop = tab_scrollbox.data(
        //         'scrollTop-tab-' + ui.index
        //     );
        //     if(!scrollTop) scrollTop = 0;
        //     $('#tab_scrollbox').scrollTop( scrollTop );
        //     if(ui.index == 3){
        //         plupload.uploader.refresh();
        //     }
        // });
        
        container.splitter({
            type: "v",
            outline: true,
            resizeToWidth: true,
            cookie: "vsplitter",
            anchorToWindow: true,
            sizeRight: true
        }).mousedown( function(edown){
            $(edown.target).one('mouseup', function(eup){
                //if( edown.clientX == eup.clientX ) console.log('not moved');
            });
        });

        if( $.query.get('dir') && $.query.get('file') ){
            Provi.Data.Io.import_example( 
                $.query.get('dir'), 
                $.query.get('file'), 
                Provi.Data.Io.type_from_filename( $.query.get('file') ),
                { applet: Provi.Jmol.get_default_applet( true ) }
            );
        }

        $('body').append(
            '<div id="trash" style="display:hidden;"></div>' +
            '<div id="temp" style="display:hidden;"></div>'
        );
    }


    Provi.load = function( fn ){

        function load_css_fn( url ){
            return function(){
                var link = document.createElement( "link" );
                link.setAttribute( "rel", "stylesheet" );
                link.setAttribute( "type", "text/css" );
                link.setAttribute( "href", url );
                document.getElementsByTagName( "head" )[0]
                    .appendChild( link );
            }
        }

        $LAB
            .script("../js/lib/underscore-min.js").wait()
            .script("../js/lib/underscore.inflection.js")
            .script("../js/lib/underscore.string.min.js")

            .script("../js/lib/canvg/rgbcolor.js")
            .script("../js/lib/canvg/canvg.js")
            .script("../js/lib/canvg/svgfix.js")

            .script("../js/lib/jquery.js").wait()
            .script("../js/lib/jquery.query.js")
            .script("../js/lib/jquery.tmpl.min.js")
            .script("../js/lib/jquery.cookie.js")

            .script("../js/lib/jquery-splitter/splitter.js")
            .script("../js/lib/jquery-ui/js/jquery-ui.min.js").script(
                load_css_fn( Provi.config.jquery_ui_css )
            )
            .script("../js/lib/jstree/jquery.jstree.js")
            .script("../js/lib/qtip2/jquery.qtip.min.js").script(
                load_css_fn( "../js/lib/qtip2/jquery.qtip.min.css" )
            )
            .script("../js/lib/jquery-colorPicker/jquery.colorPicker.js")
                .script( load_css_fn( 
                    "../js/lib/jquery-colorPicker/colorPicker.css" )
            )
            
            .script("../js/lib/slickgrid/lib/jquery.event.drag-2.0.min.js")
            .script("../js/lib/slickgrid/slick.core.js")
            .script("../js/lib/slickgrid/slick.editors.js")
            .script("../js/lib/slickgrid/slick.grid.js").script(
                load_css_fn( "../js/lib/slickgrid/slick.grid.css" )
            )

            .script("../js/lib/jquery.sizes.js").wait()
            .script("../js/lib/jlayout.grid.js")
            .script("../js/lib/jlayout.border.js")
            .script("../js/lib/jlayout.flexgrid.js").wait()
            .script("../js/lib/jquery.jlayout.js")

            .script("../js/lib/sylvester.js")
            .script("../js/lib/numeric.js")
            .script("../js/lib/base64.js")

            .script("../js/lib/plupload/js/plupload.full.js")
            
            .script("../js/lib/flot/jquery.flot.js").wait()
            .script("../js/lib/flot/jquery.flot.image.js")
            .script("../js/lib/flot/jquery.flot.symbol.js")
            .script("../js/lib/flot/jquery.flot.selection.js")
            .script("../js/lib/flot/jquery.flot.navigate.js")

            .script("../js/lib/d3/d3.v2.js")

            .script("../js/Provi.Debug.js")
            .script("../js/Provi.Utils.js")
            .script("../js/Provi.Widget.js").wait()
            .script("../js/Provi.Widget.Grid.js")

            .script("../js/Provi.Data.js").wait()
            .script("../js/Provi.Data.Io.js")
            .script("../js/Provi.Data.Job.js")

            .script("../js/Provi.Bio.js").wait()
            .script("../js/Provi.Bio.AtomProperty.js")
            .script("../js/Provi.Bio.AtomSelection.js")
            .script("../js/Provi.Bio.Alignment.js")
            .script("../js/Provi.Bio.Helix.js")
            .script("../js/Provi.Bio.HydrogenBonds.js")
            .script("../js/Provi.Bio.Structure.js")
            .script("../js/Provi.Bio.Superposition.js")
            .script("../js/Provi.Bio.Voronoia.js")
            .script("../js/Provi.Bio.Rotamers.js")
            .script("../js/Provi.Bio.MembranePlanes.js")
            .script("../js/Provi.Bio.InterfaceContacts.js")
            .script("../js/Provi.Bio.Isosurface.js")
            .script("../js/Provi.Bio.Linker.js")
            .script("../js/Provi.Bio.Flatland.js")
            .script("../js/Provi.Bio.Mutate.js").wait()
            .script("../js/Provi.Data.Controller.js")

            .script("../js/Provi.Jmol.js").wait()
            .script("../js/Provi.Jmol.Settings.js")
            .script("../js/Provi.Jmol.Controls.js")
            .script("../js/Provi.Jmol.Analysis.js")
            .script("../js/Provi.Jmol.Modeling.js")
            .script("../js/Provi.Jalview.js")
            .wait( function(){
                load_css_fn("../css/keys.css")();
                load_css_fn("../css/view.css")();
                fn();
            });
    }
    
})();