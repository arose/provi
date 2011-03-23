/**
 * @fileOverview This file contains the {@link Provi.Data.Controller.StructureMixin} controller.
 * @author <a href="mailto:alexander.rose@charite.de">Alexander Rose</a>
 * @version 0.0.1
 */

/**
 * @class
 */
Provi.Data.Controller.StructureMixin = {
    available_widgets: {},
    load_params_widget: [{
        name: 'load_as',
        obj: Provi.Jmol.JmolLoadAsSelectorWidget,
        getter: 'get_value'
    }],
    init: function(params){
        if( typeof(params) == 'object' && params.applet && params.load_as ){
            this.load( params.applet, params.load_as );
        }
        Provi.Data.Dataset.prototype.init.call(this, params);
    },
    load: function( applet, load_as ){
	var self = this;
        var params = '?id=' + this.server_id;
        var type = this.type;
        if( $.inArray(this.type, ['pdb', 'sco', 'mbn', 'vol']) >= 0 ){
            params += '&data_action=get_pdb';
            type = 'pdb';
        }
        var jmol_types = {
            pdb: 'PDB',
            gro: 'GROMACS'
        };
        type = jmol_types[type];
	type = type ? (type + '::') : '';
	type = '';
	
        var style = 'select all; spacefill off; wireframe off; backbone off; cartoon on; ' +
	    //'select protein; color cartoon structure; color structure; ' +
	    'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ' +
            'select (ligand or ypl or lrt); wireframe 0.16; spacefill 0.5; color cpk; ' +
            'select water; wireframe 0.01;' +
	    'select group=hoh; cpk 20%;' +
	    'select (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt)); wireframe 0.1;' + 
	    'select (dmpc or dmp or popc or pop); wireframe 0.1;' +
	    'select none;';
        
        if( load_as != 'append' ) applet._delete();
	
	// load structural data into the jmol applet
	if(load_as == 'trajectory'){
	    applet.script('load TRAJECTORY "' + type + '../../data/get/' + params + '"; ' + style);
	}else if(load_as == 'append'){
	    var style2 = 'select file = _currentFileNumber; spacefill off; wireframe off; backbone off; cartoon on; ' +
		//'select protein; color cartoon structure; color structure; ' +
		'slab on; set slabRange 10.0; set zShade on; set zSlab 95; set zDepth 5; ' +
		'select (file = _currentFileNumber and (ligand or ypl or lrt)); wireframe 0.16; spacefill 0.5; color cpk; ' +
		'select (file = _currentFileNumber and water); wireframe 0.01;' +
		'select (file = _currentFileNumber and group=hoh); cpk 20%;' +
		'select (file = _currentFileNumber and (hetero or ypl or lrt) and connected(protein) or within(GROUP, protein and connected(hetero or ypl or lrt))); wireframe 0.1;' + 
		'select (file = _currentFileNumber and (dmpc or dmp or popc or pop)); wireframe 0.1;' +
		'select none;';
	    applet.script('load APPEND "' + type + '../../data/get/' + params + '"; ' + style2 + ' frame all; ');
	//}else if(load_as == 'new'){
	}else{
	    console.log('../../data/get/' + params);
	    applet.script('load "' + type + '../../data/get/' + params + '"; ' + style);
	}
    },
    jmol_load: function(){
        var selection = 'protein and {*}';
        var format = '\'%[group]\',\'%[sequence]\',%[resno],\'%[chain]\',\'%[atomName]\',%[atomNo],\'%[model]\'';
        var protein_data = applet.evaluate('"[" + {' + selection + '}.label("[' + format + ']").join(",") + "]"');
        //console.log( protein_data );
        protein_data = protein_data.replace(/\'\'/g,"'");
        //console.log( protein_data );
        protein_data = eval( protein_data );
        
        var s = new Bio.Pdb.Structure('1');
        var m = new Bio.Pdb.Model('1');
        s.add( m );
        
        $.each(protein_data, function() {
            //console.log(this);
            var atom = this;
            //console.log(atom);
            var group = atom[0],
                sequence = atom[1],
                resno = atom[2],
                chain = atom[3],
                atomName = atom[4],
                atomNo = atom[5];
            
            var c = m.get( chain );
            //console.log('chain', chain, c);
            if( !c ){
                c = new Bio.Pdb.Chain( chain );
                m.add( c );
            }
            
            var r = c.get( resno );
            //console.log('residue', resno, r);
            if( !r ){
                r = new Bio.Pdb.Residue( resno, group );
                c.add( r );
            }
            
            var a = new Bio.Pdb.Atom( atomName, [], 0, 0, "", atomName, atomNo, "" );
            try{
                r.add( a );
            }catch(err){
                //console.log(err);
            }
        });
        
        //console.log(m);
        self.set_data( s );
        new Provi.Bio.Sequence.TreeViewWidget({
            parent_id: 'tab_tree',
            dataset: self
        });
    }
}