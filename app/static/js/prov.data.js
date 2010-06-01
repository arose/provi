


function loadDataWidget(parent, rect, id, anchors){
    console.log(parent);
    var content = '<div id="load" class="control_group">' +
        '<input type="file" id="load_file" />' +
        '<div id="data_list"></div>' +
    '</div>';
    
    widget( parent, content, rect, id, anchors );
    updateDataList();
    
    $('#load_file').change(function(){
        var reader = new FileReader();  
        reader.onload = function(e) {
            console.log('data loaded');
            //jmolLoadInline(e.target.result);
            var add_data_url = "../../data/add/";
            var data_to_post = {'datatype': 'pdb', 'provider': 'file', 'data': e.target.result};
            $.post( add_data_url, data_to_post, function(post_response_data){
                console.log('add data response:', post_response_data);
                $.get( '../../data/get/', {'id': post_response_data}, function(get_response_data){
                    jmolLoadInline(get_response_data);
                });
                updateDataList();
                init_pdb_tree( "../../data/get/?id=" + post_response_data + "&data_action=get_tree" );
            });
        };
        reader.readAsText(this.files[0]);
    });
}


function updateDataList(){
    $('#data_list').load('../../data/index/', function() {
        console.log('data list loaded');
    });
}