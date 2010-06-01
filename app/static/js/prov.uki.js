uki.view.declare('uki.view.TabPanel', uki.view.Container, function(Base) {
    this.typeName = function() { return 'uki.view.TabPanel'; };
    
    this._setup = function() {
        Base._setup.call(this);
    };
    
    this._initVisibility = function(){
        uki.each(this._panels, function(i, panel){
            panel.visible(false);
        });
        this._panels[0].visible(true);
    }
    
    this.config = uki.newProp('_config', function(c) {
        this._config = c;
        
        var toolbarConfig = this._config.bar
        toolbarConfig.view = 'Toolbar';
        toolbarConfig.buttons = [];
        
        this._panels = [];
        
        uki.each(this._config.tabs, function(i, tab){
            toolbarConfig.buttons.push( tab.button );
            
            var boxConfig = tab.panel;
            boxConfig.view = 'VFlow';
            var box = uki.build(uki.extend( boxConfig ))[0];
            this._panels.push( box );
            this.appendChild( box );
        }, this);
        
        this._toolbar = uki.build(uki.extend( toolbarConfig ))[0];
        this.appendChild( this._toolbar );
        
        var tabButtons = this._toolbar.childViews()[0].childViews();
        var tabPanels = this._panels;
        
        uki.each(tabButtons, function(i, button){
            button.bind('click', function() {
                uki.each(tabPanels, function(j, panel){
                    panel.visible(false);
                });
                tabPanels[i].visible(true);
            });
        }, this);
        
        //uki.each(tabPanels, function(i, panel){
            //panel.visible(false);
        //});
        //tabPanels[0].visible(true);
    });
});





// todo
function widget (parent, content, rect, id, anchors) {
    //var boxConfig = { view: 'Box', rect: rect, anchors: anchors, id: id };
    //var box = uki.build( uki.extend( boxConfig ) )[0];
    //var dom = parent[0].appendChild(box);
    parent[0].dom().innerHTML += content;
}



//var tabPanel = uki('#tab-panel')[0];
//var tabButtons = tabPanel._childViews[0]._childViews;
//var tabIds = ['Controls', 'Tree', 'Load'];

//uki.each(tabIds, function(i, id){
//    $('#' + id).html(id);
//    uki('#' + id).visible(false);
//});
//uki('#Controls').visible(true);

//console.log(tabPanel);

//uki.map(tabButtons, initTab, this);


function initTab(button){
    //console.log(button);
    button.bind('click', function(e) {
        //console.log(button.text());
        uki.each(tabIds, function(i, id){
            //console.log(id, button.text());
            if(id == button.text()){
                uki('#' + id).visible(true);
            }else{
                uki('#' + id).visible(false);
            }
        });
    });
}






