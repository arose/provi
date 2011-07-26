/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.StoryMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.StoryMixin = {
    available_widgets: {
        'StoryWidget': Provi.Widget.StoryWidget
    },
    init: function( params ){
        var self = this;
        new Provi.Widget.StoryWidget( $.extend( params, {
            parent_id: Provi.defaults.dom_parent_ids.DATASET_WIDGET,
            dataset: self
        }));
        Provi.Data.Dataset.prototype.init.call(this, params);
    }
}