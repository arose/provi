if($(document).getUrlParam("filename")){
    filename = $(document).getUrlParam("filename");
}else{
    filename = '';
}


DATASET_ID = $(document).getUrlParam("dataset_id");
TMHELIX_ID = $(document).getUrlParam("tmhelix_dataset_id")

if($(document).getUrlParam("sco_dataset_id")){
    var pdb_url = "../../datasets/" + $(document).getUrlParam("sco_dataset_id") + "/display/" + filename + "?pdb=1";
}else{
    var pdb_url = "../../datasets/" + DATASET_ID + "/display/" + filename + "?plain=1&pdb=1";
}

var dataProviderType = $(document).getUrlParam("dataProviderType");
if(dataProviderType == 'local'){
    pdb_url = "../../data/3dqb/3dqb.pdb";
}

$(document).ready(function(){
    $('#ajax-spinner').hide();
    $('#ajax-spinner').ajaxStart(function() {
      $(this).show();
    }).ajaxStop(function() {
      $(this).hide();
    });
    
    var dataset_name = decodeURI($(document).getUrlParam("dataset_name"));
    document.title = $(document).getUrlParam("dataset_hid") + ": " + dataset_name + " - " + document.title;
    $("#datasetInfo").append("<dt>ID</dt><dd>" + DATASET_ID + "</dd>");
    $("#datasetInfo").append("<dt>History ID</dt><dd>" + $(document).getUrlParam("dataset_hid") + "</dd>");
    $("#datasetInfo").append("<dt>Name</dt><dd>" + dataset_name + "</dd>");
    
    //jmolScriptWait("load " + pdb_url + "; background white; set PickCallback \"jmolPickCallback\";");
    display.init("style");
    
    try {
        wait(10,
            function(){
                //console.log('waiting', applet);
                var applet = _jmolGetApplet();
                if(applet && ($.isFunction(applet.script)) ){
                    //console.log('test123');
                    var ret = jmolScriptWait("foo");
                    if(ret == "undefined\n"){
                        return false;
                    }else{
                        return true;
                    }
                }else{
                    return false;
                }
            },
            function(){
                //var f = jmolScriptWait("load " + pdb_url + "; background white; set PickCallback \"jmolPickCallback\";");
                var f = jmolScriptWait("set PickCallback \"jmolPickCallback\";");
                //console.log(f, 'loading pdb');
                display.setStyle();
            }
        );
    } catch(e) {
        display.setStyle();
    }
    
    var mplane_dataset_id = $(document).getUrlParam("mplane_dataset_id");
    if(mplane_dataset_id){
        membranePlanes.init(mplane_dataset_id, "mplane_size");
    }else{
        $('#mplane').hide();
    }
    
    var sco_dataset_id = $(document).getUrlParam("sco_dataset_id");
    if(sco_dataset_id){
        interfaces.init(sco_dataset_id, "cutoff", "interface_name", "show_only_interface_atoms", "color_interface_residue");
    }else{
        $('#interface').hide();
    }
    
    helixContacts.init('max_atom_distance', 'max_helix_distance', 'max_axis_angle',
                       'contacts_tree', 'show_only_contact_helices', 'contact_type');
    
    if($(document).getUrlParam("sco_dataset_id")){
        var pdb_tree_url = "../../datasets/" + $(document).getUrlParam("sco_dataset_id") + "/display/" + filename + "?pdb_tree=1";
    }else{
        var pdb_tree_url = "../../datasets/" + $(document).getUrlParam("dataset_id") + "/display/" + filename + "?pdb_tree=1";
    }
    $("#pdb_tree").dynatree({
        checkbox: true,
        selectMode: 3,
        initAjax: {
            url: pdb_tree_url,
            data: {
                'root': "source"
            }
        },
        onLazyRead: function(dtnode){
            dtnode.appendAjax({
                url: pdb_tree_url,
                data: {
                    "root": dtnode.data.key
                },
                success: function(dtnode) {
                    if(dtnode.isSelected()){
                        $.each(dtnode.childList, function(){
                            this._select(true,false,true);
                        });
                    }
                }
            });
        },
        onSelect: function(flag, dtnode) {
            if( ! flag ){
                var key = dtnode.data.key.split('-');
                //console.log("You deselected node with title " + dtnode.data.title);
                //console.log(key);
                var s;
                if(key.length == 3){
                    s = "select " + key[2] + ":" + key[1] + "; color grey;";
                }else if(key.length == 2){
                    s = "select *:" + key[1] + "; color grey;";
                }else if(key.length == 1){
                    s = "select all; color grey;";
                }
                //console.log(s);
                jmolScript(s);
                interfaces.draw();
            }
            colorSelectedNodes(dtnode.tree);
            //console.log("Selected keys: '" + selectedKeys.join("', '") + "'");
        }
    });
    
    if($(document).getUrlParam("helixcontact_dataset_id")){
        var contacts_tree_url = "../../datasets/" + $(document).getUrlParam("helixcontact_dataset_id") + "/display/" + (filename ? filename.substring(0,filename.lastIndexOf('.')) + '.helixcontact' : '');
        //var contacts_tree_url = "../../datasets/" + $(document).getUrlParam("helixcontact_dataset_id") + "/display/" + filename;
    
        $("#contacts_tree").dynatree({
            checkbox: true,
            selectMode: 3,
            initAjax: {
                url: contacts_tree_url,
                data: {
                    'root': "source"
                }
            },
            onLazyRead: function(dtnode){
                dtnode.appendAjax({
                    url: contacts_tree_url,
                    data: {
                        "root": dtnode.data.key
                    },
                    success: function(dtnode) {
                        if(dtnode.isSelected()){
                            $.each(dtnode.childList, function(){
                                this._select(true,false,true);
                            });
                        }
                        
                        var key = dtnode.data.key.split(',');
                        if(key.length == 3){
                            var childKey = dtnode.childList[0].data.key.split(',');
                            var out = jmolScriptWait('print {' + childKey[3] + '}.strucno');
                            var echo = /.*scriptEcho,0,(.*)\n.*/.exec(out);
                            //console.log(childKey, echo);
                            if(echo && echo.length){
                                dtnode.data.strucno1 = echo[1];
                            }
                            
                            var ed = dtnode.childList[0].data.extra_data[helixContacts.type];
                            var out = jmolScriptWait('print {' + ed.AS2.residue + ":" + ed.AS2.chain + '}.strucno');
                            var echo = /.*scriptEcho,0,(.*)\n.*/.exec(out);
                            //console.log(childKey, echo);
                            if(echo && echo.length){
                                dtnode.data.strucno2 = echo[1];
                            }
                        }
                        
                        //console.log('after loading', dtnode);
                        helixContacts.draw(true);
                    }
                });
            },
            onSelect: function(flag, dtnode) {
                var key = dtnode.data.key.split(',');
                //console.log("You deselected node with title " + dtnode.data.title);
                //console.log(key, flag);
                if(key.length == 3){
                    if(!dtnode.hasChildren() && dtnode.data.isLazy){
                        dtnode.reload(true);
                    }else{
                        helixContacts.draw(true);
                    }
                }else{
                    helixContacts.draw();
                }
            }
        });
    }else{
        $('#contacts').html('No helix contacts info available');
    }
    
    $("#splitter").splitter({
        type: "v",
        outline: true,
        resizeToWidth: true,
        cookie: "vsplitter",
        anchorToWindow: true
    });
    
    $("#tabs").tabs({ cookie: { expires: 30 } });
    
    $('#tab_scrollbox').scroll(function (event) {
        $(this).data('scrollTop-tab-' + $("#tabs").tabs('option', 'selected'), $(this).scrollTop());
    });
    
    $('#tabs').bind('tabsshow', function(event, ui) {
        var scrollTop = $('#tab_scrollbox').data('scrollTop-tab-' + ui.index);
        if(!scrollTop) scrollTop = 0;
        $('#tab_scrollbox').scrollTop( scrollTop );
    });
    
    if(TMHELIX_ID){
        tmhelices.init(TMHELIX_ID);
    }
    
    var hbonds_id = $(document).getUrlParam("hbonds_dataset_id");
    if(hbonds_id){
        hbonds.init(hbonds_id, 'show_hbonds', (TMHELIX_ID ? true : false) );
    }else{
        $('#hbonds').hide();
    }
    
    if($(document).getUrlParam("helixcontact_dataset_id")){
        $("#draw_contact_graph").change( function() {
            if( $("#draw_contact_graph").is(':checked') ){
                contactGraph.init();
                //contactGraph.draw();
            }
        });
    }
    
    jmolEvalPrint.init( $('#jmolCmdInput'), $('#jmolCmdLog') );
    
    clipping.init();
    
    var vis_id = $(document).getUrlParam("vis_id");
    if(vis_id){
        var add_state_url = "../../protein_viewer/add_state_async";
        $('#save_state').click(function (){
            $('#save_state').removeClass('save_state_ok save_state_error');
            var state = jmolGetPropertyAsString("stateInfo");
            $.post( add_state_url, {'state': state, 'id': vis_id}, function(data){
                //console.log('save state response:', data);
                if(data){
                    $('#save_state').addClass('save_state_ok');
                    setTimeout(function(){
                        $('#save_state').removeClass('save_state_ok');
                    }, 5000);
                }else{
                    $('#save_state').addClass('save_state_error');
                }
            });
        });
        
        var get_latest_state_url = "../../protein_viewer/get_latest_state_async";
        $.get(get_latest_state_url, {'id': vis_id}, function(data) {
            jmolScript(data);
        }, 'text');

    }else{
        $('#state').hide();
    }

    $('#center_protein').click(function (){
        jmolScript('zoom(all) 100;');
    });
    
});