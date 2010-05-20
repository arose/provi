uki.view.declare('uki.view.TabPanel', uki.view.Container, function(Base) {
    this.typeName = function() { return 'uki.view.TabPanel'; };
    
    this.config = uki.newProp('_config', function(c) {
        this._config = c;
        
        var toolbarConfig = this._config.bar
        toolbarConfig.view = 'Toolbar';
        toolbarConfig.buttons = [];
        
        this._panels = [];
        
        uki.each(this._config.tabs, function(i, tab){
            toolbarConfig.buttons.push( tab.button );
            
            var boxConfig = tab.panel;
            boxConfig.view = 'Box';
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
                uki.each(tabPanels, function(i, panel){
                    panel.visible(false);
                });
                tabPanels[i].visible(true);
            });
        }, this);
    });
});


uki({
  // create a split pane...
    view: 'HSplitPane', rect: '1000 600', anchors: 'left top right bottom',
    handlePosition: 800, leftMin: 700, rightMin: 300, autogrowLeft: true, autogrowRight: false,
    // ...with button on the left
    leftChildViews: [
        { view: 'Box', rect: '800 600', anchors: 'left top right bottom', id: 'main', text: 'bar' }
    ],
    // ...and a vertical split pane on the right...
    rightChildViews: [
        { view: 'TabPanel', rect: '0 0 190 600', anchors: 'left top right bottom', id: 'tab-panel', config: {
            bar: { rect: '0 0 180 24', anchors: 'left top right' },
            tabs: [
                {
                    button: { text: 'Controls' },
                    panel: { rect: '0 24 190 576', anchors: 'left top right bottom', background: 'red', id: 'tab-controls' }
                },
                {
                    button: { text: 'Tree' },
                    panel: { rect: '0 24 190 576', anchors: 'left top right bottom', background: 'green' }
                },
                {
                    button: { text: 'Load' },
                    panel: { rect: '0 24 190 576', anchors: 'left top right bottom' }
                }
            ]}
        }
    ]
}).attachTo( window, '1000 600' );


initJmol();
addJmolApplet('main', '99%');



// todo
function widget (parent, content, rect, id, anchors) {
    var boxConfig = { view: 'Box', rect: rect, anchors: anchors, id: id };
    var box = uki.build( uki.extend( boxConfig ) )[0];
    var dom = parent.appendChild(box);
    //console.log(dom);
    console.log(box);
    box.dom().innerHTML = content;
}

widget( uki('#tab-controls'), '<input type="file" id="load_file" />', '100 100', 'test-widget', 'left top right bottom' );

$('#load_file').change(function(){
    var reader = new FileReader();  
    reader.onload = function(e) { jmolLoadInline(e.target.result); };
    reader.readAsText(this.files[0]);  
})

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
            console.log(id, button.text());
            if(id == button.text()){
                uki('#' + id).visible(true);
            }else{
                uki('#' + id).visible(false);
            }
        });
    });
}






function initJmol(){
    jmolInitialize("../applet/jmol/11.8.22/");
    jmolSetAppletColor("white");
}

function addJmolApplet(domId, size, script, nameSuffix){
    var currentDocument = _jmol.currentDocument;
    jmolSetDocument(false);
    $('#' + domId).html( jmolApplet(size, script, nameSuffix) );
    jmolSetDocument(currentDocument);
}