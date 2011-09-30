/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.IsosurfaceMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.IsosurfaceMixin = {
    available_widgets: {
        'IsosurfaceWidget': Provi.Bio.Isosurface.IsosurfaceWidget
    },
    load_params_widget: [
        {
            params: [
                { name: 'within', getter: 'get_within' },
                { name: 'insideout', getter: 'get_insideout' },
                { name: 'reload_widget', getter: 'get_reload_widget' }
            ],
            obj: Provi.Bio.Isosurface.LoadParamsWidget
        }
    ],
    init: function( params ){
        var self = this;
        Provi.Data.Dataset.prototype.init.call(this, params);
        console.log( this, params );
        if( params.reload_widget ){
            params.reload_widget.reload(params);
        }else if( params.applet ){
            new Provi.Bio.Isosurface.IsosurfaceWidget({
                parent_id: 'tab_widgets',
                dataset: self,
                applet: params.applet,
                within: params.within,
                insideout: params.insideout,
                select: params.select,
                ignore: params.ignore,
                color: params.color,
                style: params.style,
                focus: params.focus,
                sele: params.sele
            });
        }
    }
}


/**
 * @class
 */
Provi.Data.Controller.VolumeMixin = {
    available_widgets: {
        'VolumeWidget': Provi.Bio.Isosurface.VolumeWidget
    },
    load_params_widget: [
        {
            params: [
                { name: 'within', getter: 'get_within' },
                { name: 'insideout', getter: 'get_insideout' },
                { name: 'reload_widget', getter: 'get_reload_widget' }
            ],
            obj: Provi.Bio.Isosurface.LoadParamsWidget
        },
        {
            params: [
                { name: 'sigma', getter: 'get_sigma' },
                { name: 'cutoff', getter: 'get_cutoff' },
                { name: 'sign', getter: 'get_sign' },
                { name: 'color_density', getter: 'get_color_density' },
                { name: 'downsample', getter: 'get_downsample' }
            ],
            obj: Provi.Bio.Isosurface.VolumeParamsWidget
        },
        {
            params: [
                { name: 'resolution', getter: 'get_resolution' },
                { name: 'select', getter: 'get_select' },
                { name: 'ignore', getter: 'get_ignore' },
                { name: 'type', getter: 'get_type' }
            ],
            obj: Provi.Bio.Isosurface.SurfaceParamsWidget
        }
    ],
    init: function( params ){
        var self = this;
        Provi.Data.Dataset.prototype.init.call(this, params);
        console.log( this, params );
        if( params.reload_widget ){
            new Provi.Bio.Isosurface.VolumeWidget( $.extend( params, {
                parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
                dataset: self
            }));
        }
    }
}