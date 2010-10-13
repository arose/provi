
module( 'Provi.Bio.Smcra' );

(function(){

var Smcra = Provi.Bio.Smcra;

function make_struc(){
    var struc = new Smcra.Structure('my_struc');
    
    struc.add( new Smcra.Model('m1') );
    struc.add( new Smcra.Model('m2') );
    struc.add( new Smcra.Model('m3') );
    
    struc.detach_child('m2');
    
    var m1 = struc.get('m1');
    var c1 = new Smcra.Chain('C');
    var res = new Smcra.Residue('r1');
    var at = new Smcra.Atom('a1', '', 11);
    res.add( at );
    res.add( new Smcra.Atom('a2', '', 22) );
    res.add( new Smcra.Atom('a3', '', 33) );
    
    m1.add( c1 );
    m1.add( new Smcra.Chain('C2') );
    m1.add( new Smcra.Chain('C3') );
    m1.add( new Smcra.Chain('C4') );
    c1.add( res );
    
    //console.log(struc, struc.get_chains());
    
    return struc;
}



test('.get_chains()', function() {
    var chains = make_struc().get_chains();
    //console.log(chains);
    same( chains[0].get_id(), 'C', 'id of first chain');
    
    var full_ids = $.map( chains, function(c){ return [c.get_full_id()] } );
    //console.log(full_ids);
    same( full_ids, [ [ "my_struc", "m1", "C" ], [ "my_struc", "m1", "C2" ], [ "my_struc", "m1", "C3" ], [ "my_struc", "m1", "C4" ] ], 'check full ids' );
});


test('instanceof', function() {
    var struc = make_struc();
    ok( struc instanceof Provi.Bio.Smcra.Structure, 'test instanceof for Provi.Bio.Smcra.Structure' );
    ok( !({} instanceof Provi.Bio.Smcra.Structure), 'test {} not instanceof Provi.Bio.Smcra.Structure' );
});


test('Provi.Bio.Smcra.AbstractPropertyMap', function(){
    var struc = make_struc();
    
    var property_dict = {};
    $.each( struc.get_atoms(), function(i, atom){
        console.log( atom.get_full_id() );
        property_dict[ atom.get_full_id() ] = atom.bfactor
    });
    
    console.log( property_dict );
    
    $.each( property_dict, function(i, e){
        console.log( i, e );
    })
    
    var property_map = new Smcra.AbstractPropertyMap( property_dict );
    
    console.log( property_map );
    
    same( property_map.get( [ "my_struc", "m1", "C", "r1", "a1" ] ), 11, 'access property map' );
});


})();