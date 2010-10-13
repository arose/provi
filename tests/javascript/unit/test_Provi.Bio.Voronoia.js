
module( 'Provi.Bio.Voronoia' );

(function(){

var Voronoia = Provi.Bio.Voronoia;


test('instanceof working as expected?', function() {
    var voronoia_property_map = new Voronoia.Vol([ ["A", -3, "GLN", "N", 0.21612130885873901, 13.539999999999999, 49.109999999999999, 62.649999999999999, 1, 0, []] ]);
    ok( voronoia_property_map instanceof Provi.Bio.Smcra.AbstractPropertyMap, 'test if Voronoia.Vol is instanceof AbstractPropertyMap' );
});




})();