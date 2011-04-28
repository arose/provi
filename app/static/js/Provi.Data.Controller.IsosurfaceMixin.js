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
            ],
            obj: Provi.Bio.Isosurface.LoadParamsWidget
        }
    ],
    init: function( params ){
        var self = this;
        Provi.Data.Dataset.prototype.init.call(this, params);
        console.log( this, params );
        if( params.applet ){
            new Provi.Bio.Isosurface.IsosurfaceWidget({
                parent_id: 'tab_widgets',
                dataset: self,
                applet: params.applet,
                within: params.within,
                color: params.color,
                style: params.style
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
            ],
            obj: Provi.Bio.Isosurface.LoadParamsWidget
        },
        {
            params: [
                { name: 'sigma', getter: 'get_sigma' },
                { name: 'cutoff', getter: 'get_cutoff' },
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
        if( params.applet ){
            new Provi.Bio.Isosurface.VolumeWidget({
                parent_id: 'tab_widgets',
                dataset: self,
                applet: params.applet,
                within: params.within,
                sigma: params.sigma,
                cutoff: params.cutoff,
                color_density: params.color_density,
                downsample: params.downsample,
                resolution: params.resolution,
                select: params.select,
                ignore: params.ignore,
                type: params.type,
                color: params.color,
                style: params.style
            });
        }
    }
}