
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
    var at = new Smcra.Atom('a1');
    res.add( at );
    res.add( new Smcra.Atom('a2') );
    res.add( new Smcra.Atom('a3') );
    
    m1.add( c1 );
    m1.add( new Smcra.Chain('C2') );
    m1.add( new Smcra.Chain('C3') );
    m1.add( new Smcra.Chain('C4') );
    c1.add( res );
    
    console.log(struc, struc.get_chains());
    
    return struc;
}



test('.get_chains()', function() {
    var chains = make_struc().get_chains();
    console.log(chains);
    same( chains[0].get_id(), 'C', 'id of first chain');
    
    var full_ids = $.map( chains, function(c){ return [c.get_full_id()] } );
    console.log(full_ids);
    same( full_ids, [ [ "my_struc", "m1", "C" ], [ "my_struc", "m1", "C2" ], [ "my_struc", "m1", "C3" ], [ "my_struc", "m1", "C4" ] ], 'check full ids' );
});


})();