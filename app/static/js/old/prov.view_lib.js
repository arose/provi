if(typeof window.console === "undefined") {
    window.console = { log: function() { } };
}

if (window.opera && !window.console) {
    window.console = {};
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
    window.console.log = function() {
        opera.postError(arguments);
    }
}

/**
    A function for the Array object to reduce an array to unique elements
    @function
 */
Array.prototype.unique = function () {
    var r = new Array();
    o:for(var i = 0, n = this.length; i < n; i++){
        for(var x = 0, y = r.length; x < y; x++){
            if(r[x]==this[i]){
                continue o;
            }
        }
        r[r.length] = this[i];
    }
    return r;
}

/**
    A function for the Array object to compute the intersection of two arrays
    @param {Array} setB the array used for the intersection
    @function
 */
Array.prototype.intersection = function( setB ) {
   var setA = this;

   var setA_seen = {};
   var setB_seen = {};
   for ( var i = 0; i < setB.length; i++ ) {
      setB_seen[ setB[i] ] = true;
   }

   var intersection = [];
   for ( var i = 0; i < setA.length; i++ ) {
      if ( !setA_seen[ setA[i] ] ) {
         setA_seen[ setA[i] ] = true;
         if ( setB_seen[ setA[i] ] ) {
            intersection.push( setA[i] );
         }
      }
   }
   return intersection;
};


/**
    A class representing helix-helix contacts
    @class
 */
var helixContacts = {
    maxAtomDistance: 8,
    maxHelixDistance: 11,
    maxAxisAngle: 90,
    showOnlyContactHelices: false,
    type: 'BackboneKontakt',
    
    /**
        Function to initialize the helixContacts object
        @function
    */
    init: function(maxAtomDistanceId, maxHelixDistanceId, maxAxisAngleId,
                   treeId, showOnlyContactHelicesId, contactTypeId){
        
        this.maxAtomDistanceId = maxAtomDistanceId;
        this.maxHelixDistanceId = maxHelixDistanceId;
        this.showOnlyContactHelicesId = showOnlyContactHelicesId;
        this.contactTypeId = contactTypeId;
        this.treeId = treeId;
        this.tree = $("#" + treeId).dynatree("getTree");
        //console.log(this.tree);
        
        //jmolScript("set measurementLabels OFF");
        
        if($("#" + maxAtomDistanceId).val()){
            this.maxAtomDistance = $("#" + maxAtomDistanceId).val();
        }else{
            $("#" + maxAtomDistanceId).val(this.maxAtomDistance);
        }
        if($("#" + maxHelixDistanceId).val()){
            this.maxHelixDistance = $("#" + maxHelixDistanceId).val();
        }else{
            $("#" + maxHelixDistanceId).val(this.maxHelixDistance);
        }
        if($("#" + maxAxisAngleId).val()){
            this.maxAxisAngle = $("#" + maxAxisAngleId).val();
        }else{
            $("#" + maxAxisAngleId).val(this.maxAxisAngle);
        }
        this.showOnlyContactHelices = $("#" + showOnlyContactHelicesId).is(':checked');
        this.type = $("#" + this.contactTypeId + " option:selected").val();
        
        var self = this;
        
        $("#" + maxAtomDistanceId).change( function() {
            self.maxAtomDistance = $("#" + maxAtomDistanceId).val();
            self.draw(true);
        });
        
        $("#" + maxHelixDistanceId).change( function() {
            self.maxHelixDistance = $("#" + maxHelixDistanceId).val();
            self.draw(true);
        });
        
        $("#" + maxAxisAngleId).change( function() {
            self.maxAxisAngle = $("#" + maxAxisAngleId).val();
            self.draw(true);
        });
        
        $("#" + showOnlyContactHelicesId).bind('change click', function() {
            self.showOnlyContactHelices = $("#" + showOnlyContactHelicesId).is(':checked');
            self.draw();
        });
        
        $("#" + this.contactTypeId).change( function() {
            self.type = $("#" + self.contactTypeId + " option:selected").val();
            //console.log(self.type);
            self.draw();
        });
        
    },
    
    draw: function(evalFilter){
        evalFilter = typeof(evalFilter) != 'undefined' ? evalFilter : false;

        //console.log($("#contacts_tree"), $("#contacts_tree").dynatree("getTree"));
        var selectedNodes = $("#" + this.treeId).dynatree('getTree').getSelectedNodes(true);
        //console.log('before', selectedNodes);
        var self = this;
        
        var selectedContactsAs1 = [];
        var selectedContactsAs2 = [];
        var selectedContactsMeasures = [];
        
        function __selectAa(node){
            var ed = node.data.extra_data[self.type];
            //console.log(ed, node);
            selectedContactsAs1.push(ed.AS1.residue + ":" + ed.AS1.chain);
            selectedContactsAs2.push(ed.AS2.residue + ":" + ed.AS2.chain);
            selectedContactsMeasures.push("measure (" + ed.AS1.residue + ":" + ed.AS1.chain + "." + ed.AS1.atom + ") (" + ed.AS2.residue + ":" + ed.AS2.chain + "." + ed.AS2.atom + ")");
        }
        
        var selectedHelixNodes = [];
        $.map(selectedNodes, function(node){
            var key = node.data.key.split(',');
            //console.log(node.data.key);
            
            if(key.length == 2){
                $.map(node.childList, function(cnode){
                    var hnode = cnode.childList[1];
                    if(!hnode.hasChildren() && hnode.data.isLazy){
                        //console.log('load', hnode);
                        hnode.reload(true);
                    }else{
                        selectedHelixNodes.push(hnode);
                    }
                });
            }else if(node.data.key.substring(0,12) == 'helixcontact'){
                var hnode = node.childList[1];
                if(!hnode.hasChildren() && hnode.data.isLazy){
                    //console.log('load', hnode);
                    hnode.reload(true);
                }else{
                    selectedHelixNodes.push(hnode);
                }
            }
        });
        //console.log(selectedHelixNodes);
        if(selectedHelixNodes.length){
            selectedNodes = $.merge(selectedNodes, selectedHelixNodes).unique();
        }
        
        
        if(evalFilter){
            var helixContactNodes = $.map(selectedNodes, function(node){
                var key = node.data.key.split(',');
                //console.log(key);
                
                if(key.length == 4){
                    return node.parent;
                }else if(key.length == 3){
                    return node;
                }
                return false;
            });
            //console.log(helixContactNodes.unique());
            selectedNodes = helixContactNodes.unique();
        }
        
        //console.log('after', selectedNodes);
        
        var selectedKeys = $.map(selectedNodes, function(node){
            var key = node.data.key.split(',');
            //console.log(key);
            
            if(key.length == 4){
                __selectAa(node);
                
            }else if(key.length == 3){
                node._select(true, false, true);
                var selectedKeys = $.map(node.childList, function(cnode){
                    //console.log(cnode); 
                    var ed = cnode.data.extra_data[self.type];
                    //console.log(ed);
                    if(ed && ed.HelixAbstand < self.maxHelixDistance &&
                       ed.AtomAbstand < self.maxAtomDistance &&
                       (Math.abs(ed.Achsenwinkel1) < self.maxAxisAngle &&
                        Math.abs(ed.Achsenwinkel2) < self.maxAxisAngle)
                       ){
                        cnode._select(true, false, true);
                        __selectAa(cnode);
                    }else{
                        cnode._select(false, false, true);
                    }
                    return cnode.data.key;
                });
            }
        });
        
        //console.log(selectedContactsAs1, selectedContactsAs2);
        jmolScript("measure DELETE; set measurementLabels OFF;");
        interfaces.draw();
        
        var s = [];
        if(selectedContactsAs1.length){
            s.push("select " + selectedContactsAs1.join(", ") + "; color green;");
        }
        if(selectedContactsAs2.length){
            s.push("select " + selectedContactsAs2.join(", ") + "; color lightgreen;");
        }
        if(self.showOnlyContactHelices){
            var selectedHelices = [];
            $.map(selectedNodes, function(node){
                var key = node.data.key.split(',');
                
                if(key.length == 4){
                    if(node.parent.data.strucno1){
                        selectedHelices.push( node.parent.data.strucno1 );
                        selectedHelices.push( node.parent.data.strucno2 );
                    }
                    
                }else if(key.length == 3){
                    if(node.data.strucno1){
                        selectedHelices.push( node.data.strucno1 );
                        selectedHelices.push( node.data.strucno2 );
                    }
                }
            });
            
            var strucno = $.map(selectedHelices.unique(), function(no){
                return 'strucno = ' + no;
            });
            s.push('display ' + strucno.join(",") + '; zoom (' + strucno.join(",") + ') 100;');
        }
        if(selectedContactsMeasures.length){
            s.push(selectedContactsMeasures.join("; ") + ';');
        }
        if(s.length){
            //console.log(s);
            jmolScript(s.join(" "));
        }
    }
    
}

/**
    @function
 */
function colorSelectedNodes(tree) {
    var selectedNodes = tree.getSelectedNodes(true);
    var selectedAtom = [];
    var selectedRes = [];
    var selectedChain = [];
    var selectedModel = [];
    var selectedKeys = $.map(selectedNodes, function(node){
        var key = node.data.key.split('-');
        if(key.length == 4){
            //console.log("Atom: " + key[3] + " in AS: " + key[2] + " in chain " + key[1]);
            selectedAtom.push(key[2] + ":" + key[1] + "." + key[3]);
        }else if(key.length == 3){
            //console.log("AS: " + key[2] + " in chain " + key[1]);
            selectedRes.push(key[2] + ":" + key[1]);
        }else if(key.length == 2){
            selectedChain.push("*:" + key[1]);
        }else if(key.length == 1 && node.data.key != ''){
            selectedModel.push(key[0]);
        }
        return node.data.key;
    });
    //console.log(selectedAtom);
    if(selectedAtom.length)
        jmolScript("select " + selectedAtom.join(", ") + "; color red;");
    if(selectedRes.length)
        jmolScript("select " + selectedRes.join(", ") + "; color red;");
    if(selectedChain.length)
        jmolScript("select " + selectedChain.join(", ") + "; color red;");
    if(selectedModel.length)
        jmolScript("select all; color red;");
}

/**
    @function
 */
function jmolPickCallback(appletId,info,id){
    // [ARG]193:B.CZ #4197 40.248 -4.2279997 38.332996
    var parsedInfo = /\[\w.+\](\d+):([\w\d]+)\.(\w+) .*/.exec(info);
    var chain = parsedInfo[2];
    var res = parsedInfo[1];
    var atom = parsedInfo[3];
    
    var atomNodeKey = "model1-" + chain + "-" + res + "-" + atom;
    var tree = $("#pdb_tree").dynatree("getTree");
    var atomNode = tree.getNodeByKey(atomNodeKey);
    if(atomNode){
        atomNode.toggleSelect();
    }else{
        var resNodeKey = "model1-" + chain + "-" + res;
        var resNode = tree.getNodeByKey(resNodeKey);
        if(resNode){
            resNode.expand(true);
            tree = $("#pdb_tree").dynatree("getTree");

            wait(50,
                 function() {
                    return !resNode.isLoading;
                 },
                 function() {
                    atomNode = tree.getNodeByKey(atomNodeKey);
                    if(atomNode){
                        atomNode.toggleSelect();
                    }else{
                        resNode.toggleSelect();
                    }
                 }
            );
        }
    }
}

/**
    @function
 */
function wait(timeout, checkFn, onEndFn) {
    if (checkFn()){
        onEndFn();
    } else {
        setTimeout(function(){
            wait(timeout, checkFn, onEndFn);
        }, timeout);
    }
}

/**
    @function
 */
function nodeCheckboxClick(){
    //console.log(this.attr('id'));
}

/**
    @function
 */
function HistoryManager() {
    this.curr = -1;
    this.entries = [];
}

/**
    @class
    @constructor
 */
HistoryManager.prototype = {
    push: function(item) {
        if (this.entries.length && this.entries[0] == item) return;
        if (item.match(/^\s*$/)) return;
        this.entries.unshift(item);
        this.curr = -1;
    },
    scroll: function(direction) {
        var moveTo = this.curr + (direction == 'prev' ? 1 : -1);
        if (moveTo >= 0 && moveTo < this.entries.length) {
            this.curr = moveTo;
            return this.entries[this.curr];
        } else if (moveTo == -1) {
            this.curr = moveTo;
            return '';
        } else {
            return null;
        }
    }
};

/**
    @class
 */
var jmolEvalPrint = {
    log: undefined,
    input: undefined,
    
    init: function (input,log) {
        this.input = input;
        this.log = log;
        this.history = new HistoryManager();
        console.log(this.input);
        var self = this;
        this.input.keypress(function(event) {
            console.log(event.keyCode);
            if (event.keyCode == 13 && this.value) {
                try {
                    var cmd = this.value;
                    self.print('> ' + cmd);
                    var out = jmolScriptWait(cmd);
                    if( out.search(/ERROR/) != -1 ){
                        var error = /.*ERROR: (.*)\n.*/.exec(out);
                        if(error.length){
                            self.print(error[1] , '#FF0000');
                        }else{
                            self.print(out , '#FF0000');
                        }
                    }else{
                        var echo = /.*scriptEcho,0,(.*)\n.*/.exec(out);
                        if(echo && echo.length){
                            self.print(echo[1] , 'green');
                        }
                    }
                } catch (e) {
                    self.print(e.toString(), '#ff0000');
                } finally {
                    self.history.push(cmd);
                    this.value = '';
                }
            }
        });
        
        this.input.keydown(function(event) {
            var valid = {38: 'prev', 40: 'next'};
            if (event.keyCode in valid) {
                var curr = self.history.scroll(valid[event.keyCode]);
                if (curr !== null) this.value = curr;
            }
        });
    },
    
    print: function (text, color) {
        this.log.append($('<div/>').css({'color': color || 'black', margin: 0, padding: 0}).text(text));
        this.log[0].scrollTop = this.log[0].scrollHeight;
    }
}

/**
    @class
 */
var contactGraph = {
    helixAxises: false,
    AxisesColor: 'black',
    
    plane: false,
    planeColor: "blue",
    planeTranslucency: 0.6,
    planeSize: 500,
    helices: false,
    chains: false,
    show_labels: true,
    
    graph: false,
    graphData: false,
    
    init: function(){
        var self = this;
        
        wait(50,
            function() {
                return membranePlanes.planes;
            },
            function() {
                self._calcMiddlePlane();
                self.draw();
            }
        );
        
        wait(50,
            function() {
                var tree = $("#" +  helixContacts.treeId).dynatree('getTree');
                //console.log(tree, 'isInitializing', tree.isInitializing(), 'isReloading', tree.isReloading(), self.plane);
                return !tree.isInitializing() && !tree.isReloading() && !tree.getRoot().childList[0].isLoading && !(null === tree.getRoot().childList[0].childList) && self.plane && hbonds.hbond_coords;
            },
            function() {
                self._calcHelixPlaneIntersections();
                self.draw();
            }
        );
        
    },
    
    _calcMiddlePlane: function(){
        var data = membranePlanes.planes;
                
        var m1 = data[0].match(/.*{ *([-. \d]+),([-. \d]+),([-. \d]+)} *{ *([-. \d]+),([-. \d]+),([-. \d]+)} *{ *([-. \d]+),([-. \d]+),([-. \d]+)}.*/);
        m1 = $.map(m1, parseFloat);
        this.a0 = $V([ m1[1], m1[2], m1[3] ]);
        this.b0 = $V([ m1[4], m1[5], m1[6] ]);
        this.c0 = $V([ m1[7], m1[8], m1[9] ]);
        
        var m2 = data[1].match(/.*{ *([-. \d]+),([-. \d]+),([-. \d]+)} *{ *([-. \d]+),([-. \d]+),([-. \d]+)} *{ *([-. \d]+),([-. \d]+),([-. \d]+)}.*/);
        m2 = $.map(m2, parseFloat);
        this.a1 = $V([ m2[1], m2[2], m2[3] ]);
        this.b1 = $V([ m2[4], m2[5], m2[6] ]);
        this.c1 = $V([ m2[7], m2[8], m2[9] ]);
        
        this.a2 = this.a0.add(this.a1).x(0.5);
        this.b2 = this.b0.add(this.b1).x(0.5);
        this.c2 = this.c0.add(this.c1).x(0.5);
        
        this.plane = '{' + this.a2.elements + '} {' + this.b2.elements + '} {' + this.c2.elements + '}';
    },
    
    _calcHelixPlaneIntersections: function(){
        var tree = $("#" +  helixContacts.treeId).dynatree('getTree').getRoot();
        var nodes = tree.childList[0].childList[0].childList;
        
        //jmolScript('hide ALL;');
        this.helixAxises = [];
        this.graphData = [];
        var jmol_cmd = '';
        //console.log('tree', nodes);
        var k = 0;
        var p = $P( this.a2, this.b2, this.c2 );
        
        var m0 = $P( this.a0, this.b0, this.c0 );
        var m1 = $P( this.a1, this.b1, this.c1 );
        var dist_m0_m1 = m0.distanceFrom(m1);
        //console.log( 'mem dist', dist_m0_m1 );
        
        var d = p.normal.elements;
        var uL = $L( $V(p.anchor.elements), $V(d).x(-1) );
        var aL = $L( $V(p.anchor.elements), $V([d[1], -d[0], 0]) );
        var bL = $L( $V(p.anchor.elements), $V(d).cross($V(aL.direction.elements)).x(1) );
        
        jmol_cmd += 'draw lineU color blue VECTOR {' + uL.anchor.elements + '} {' + uL.direction.elements + '} SCALE 300;';
        jmol_cmd += 'draw lineA color green VECTOR {' + aL.anchor.elements + '} {' + aL.direction.elements + '} SCALE 300;';
        jmol_cmd += 'draw lineB color red VECTOR {' + bL.anchor.elements + '} {' + bL.direction.elements + '} SCALE 300;';
        
        var u = $V(uL.direction.elements);
        var a = $V(aL.direction.elements);
        var b = $V(bL.direction.elements);
        
        var self = this;
        
        $.each(nodes, function(){
            var data = this.childList[1].data;
            var edata = data.extraData;
            
            self.helixAxises.push([ edata.HelixAxisStart, edata.HelixAxisEnde ]);
            
            var x0 = $V( edata.HelixAxisStart );
            var y0 = $V( edata.HelixAxisEnde );
            var d0 = $V( edata.NormHelixAxis );
            
            var l = $L( x0, d0 );
            var i = l.intersectionWith( p );
            
            var e = i.dot(u);
            var f = i.dot(a);
            var g = i.dot(b);
            //console.log(i, x0, d0, e, f, g);
            
            var dist_x0_m0 = m0.distanceFrom(x0);
            var dist_x0_m1 = m1.distanceFrom(x0);
            var dist_y0_m0 = m0.distanceFrom(y0);
            var dist_y0_m1 = m1.distanceFrom(y0);
            var dist_x0_p = p.distanceFrom(x0);
            var dist_y0_p = p.distanceFrom(y0);
            
            if( (Math.abs( edata.AngleToMembranPlane ) > 20 && this.childList[0].childList) &&
                ( (dist_x0_m0 <= dist_m0_m1 && dist_x0_m1 <= dist_m0_m1) ||
                  (dist_y0_m0 <= dist_m0_m1 && dist_y0_m1 <= dist_m0_m1) ||
                  (dist_x0_m0 <= dist_m0_m1 && dist_x0_m1 >= dist_m0_m1 && dist_y0_m0 >= dist_m0_m1 && dist_y0_m1 <= dist_m0_m1) ||
                  (dist_x0_m0 >= dist_m0_m1 && dist_x0_m1 <= dist_m0_m1 && dist_y0_m0 <= dist_m0_m1 && dist_y0_m1 >= dist_m0_m1)
                  )){
                var hcontacts = $.map(this.childList[0].childList, function(node){
                    //console.log(node.childList[1].data.key, node);
                    var key = node.childList[1].data.key.split(',');
                    //console.log(node.childList[1].data.extraData);
                    return [[ key[2], node.childList[1].data.extraData ]];
                });
                //console.log(edata.HelixNr, 'x0-m0', dist_x0_m0, 'x0-m1', dist_x0_m1, 'y0-m0', dist_y0_m0, 'y0-m1', dist_y0_m1, 'x0-p', dist_x0_p, 'y0-p', dist_y0_p);
                //console.log('hcontacts',hcontacts);
                //console.log(this,edata,data);
                
                jmol_cmd += 'draw point' + k + ' color red CIRCLE {' + i.elements + '} SCALE 300;';
                k = k+1;
                //console.log(i.elements, i);
                self.graphData.push([ f, g, edata.HelixNr, hcontacts, edata]);
            }
        });
        
        jmol_cmd += 'draw pointAnchor color black CIRCLE {' + p.anchor.elements + '} SCALE 300;';
        jmol_cmd += 'draw pointNormal color grey CIRCLE {' + p.normal.elements + '} SCALE 300;';
        
        //console.log(p);
        jmol_cmd += 'draw planeX color TRANSLUCENT ' + this.planeTranslucency + ' yellow plane ' + this.planeSize + ' ' + this.plane + ';';
        //jmolScript(jmol_cmd);
    },
    
    draw: function(){
        var plane = 'draw planeM color TRANSLUCENT ' + this.planeTranslucency + ' ' + this.planeColor + ' plane ' + this.planeSize + ' ' + this.plane + ';';
        var i = 0;
        var hAxises = '';
        $.each(this.helixAxises, function(){
            hAxises += 'draw arrow' + i + ' color black CYLINDER {' + this[0] + '} {' + this[1] + '};';
            i = i+1;
        });
        //jmolScript(plane + hAxises);
        
        this.drawContactGraph();
    },
    
    drawContactGraph: function(){
        var self = this;
        //console.log(hbonds.hbond_coords);
        //$.each(data, function(i, d){ d.push(i) });
        var nodes = this.graphData;
        //console.log(nodes);
        if(!nodes) return false;
        
        var node_counter = 1;
        nodes = $.map(nodes, function(d){
            d[5] = node_counter;
            node_counter += 1;
            return [d];
        });
        delete node_counter;
        
        if(this.helices){
            var helices = this.helices.split(",");
            //console.log(helices);
            if(helices.length > 0){
                nodes = $.grep(nodes, function(elm, i){
                    return $.inArray(elm[5].toString() , helices) != -1;
                });
            }
        }
        //console.log(nodes);
        
        if(this.chains){
            var chains = this.chains.split(",");
            //console.log(chains);
            if(chains.length > 0){
                nodes = $.grep(nodes, function(elm, i){
                    return $.inArray(elm[4].chain , chains) != -1;
                });
            }
        }
        //console.log(nodes);
        
        //nodes = $.grep(nodes, function(elm, i){
        //    return elm[2] < 78;
        //});
        
        var cw = 680;
        var ch = 650;
        var size = 80;
        var labelSize = 0.9;
        var font = '20px sans-serif';
        //var w = cw / pv.max(data, function(d){ return d[0] });
        
        var maxX = pv.max(nodes, function(d){ return d[0]; });
        var minX = pv.min(nodes, function(d){ return d[0]; });
        var maxY = pv.max(nodes, function(d){ return d[1]; });
        var minY = pv.min(nodes, function(d){ return d[1]; });
        var scaleX = cw / (maxX + minX*(-1))
        var scaleY = ch / (maxY + minY*(-1))
        if( (maxX + minX*(-1)) * scaleY > cw ){
            var scale = scaleX;
        }else{
            var scale = scaleY;
        }
        var border = 2 * scale;
        var edgeLineWidth = scale*0.05;
        var nodeLineWidth = scale*0.2;
        var nodeLabelSize = scale*1;
        labelSize = Math.round( labelSize*scale );
        size = size*(scale/2);
        
        //console.log('min max', maxX, minX, maxY, minY, maxX + minX*(-1), (maxX + minX*(-1)) * scaleY);
        //console.log('scale', scaleX, scaleY, scale);
        //console.log(data);
        nodes = $.map(nodes, function(d){
            //console.log(d[4]);
            var node_hbonds = [];
            $.each(hbonds.hbond_coords, function(i,hb){
                var don = hb[2];
                var acc = hb[3];
                if((don[0] == d[4].chain && don[1] >= d[4].begin && don[1] <= d[4].end) ||
                   (acc[0] == d[4].chain && acc[1] >= d[4].begin && acc[1] <= d[4].end)){
                    node_hbonds.push([don, acc]);
                }
            });
            //console.log(node_hbonds);
            d[6] = node_hbonds;
            return [[ (d[0] + minX*(-1)) * scale,
                      (d[1] + minY*(-1)) * scale,
                      d[2],
                      d[3],
                      d[4],
                      d[5],
                      d[6]
                    ]];
        });
        
        var vis = new pv.Panel()
                    .canvas("contactGraph")
                    .width(cw).height(ch)
                    .top(border).left(border).right(border).bottom(border);
        
        //console.log('foo',nodes);
        var edges = [];
        var hbonds_edges = [];
        $.each(nodes, function(i,node){
            //console.log(node);
            if(node.length >= 4){
                $.each(node[3], function(j,partner_node_data){
                    //console.log('partner node', partner_node_data);
                    $.each(nodes, function(k,partner_node){
                        // find and add hbonds edges
                        //console.log('partner node', partner_node);
                        //console.log('node', node);
                        if(false && node[2] < partner_node_data[0] && partner_node_data[0] == partner_node[2]){
                            hbonds_edges.push([ [node[0], node[1]], [partner_node[0], partner_node[1]], partner_node_data ]);
                        }
                        
                        if(node[2] < partner_node_data[0] && partner_node_data[0] == partner_node[2]){
                            //console.log('partner node', partner_node);
                            //console.log('node', node);
                            var hbonds_count = node[6].intersection(partner_node[6]).length;
                            //console.log('intersection', hbonds_count);
                            edges.push([ [node[0], node[1]], [partner_node[0], partner_node[1]], partner_node_data, hbonds_count ]);
                        }
                    });
                });
            }
        });
        //console.log('edges', edges);
        
        var label_focus = false;
        
        $.each(edges, function(i,node){
            var points = [ node[0], node[1] ];
            //if(node[3]){
            //    vis.add(pv.Line)
            //        .data(points)
            //        .left(function(d){ return d[0]+edgeLineWidth; })
            //        .bottom(function(d){ return d[1]+edgeLineWidth; })
            //        .strokeStyle('orange')
            //        .lineWidth(edgeLineWidth)
            //}
            vis.add(pv.Line)
                .data(points)
                .left(function(d){ return d[0]; })
                .bottom(function(d){ return d[1]; })
                .strokeStyle('green')
                .lineWidth(edgeLineWidth)
                
            if(self.show_labels){
                //console.log(node);
                var pWidth = scale * 3.8;
                var pHeight = scale * 1.1;
                var lp = vis.add(pv.Panel)
                            .left( pv.min([node[0][0],node[1][0]]) + Math.abs(node[0][0]-node[1][0])/2 - pWidth/2 )
                            .bottom( pv.min([node[0][1],node[1][1]]) + Math.abs(node[0][1]-node[1][1])/2 - pHeight/2 )
                            .width( pWidth )
                            .height( pHeight )
                            .fillStyle( function(){ return label_focus ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, .6)"; })
                            .strokeStyle(null)
                            .lineWidth(0);
                            
                lp.event("mouseover", function(){
                    console.log(this);
                    this.strokeStyle('red');
                    this.lineWidth(0.1*scale);
                    this.children[0].textStyle('black');
                    this.fillStyle( "rgba(255, 255, 255, .6)" );
                    label_focus = true;
                    vis.render();
                });
                lp.event("mouseout", function(a,d){
                    this.lineWidth(0);
                    this.children[0].textStyle( function(){ return label_focus ? "rgba(128, 128, 128, .3)" : 'grey'; })
                    this.fillStyle( function(){ return label_focus ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, .6)"; });
                    label_focus = false;
                    vis.render();
                });
                
                
                lp.anchor("center").add(pv.Label)
                    //.left( pv.min([node[0][0],node[1][0]]) + Math.abs(node[0][0]-node[1][0])/2 )
                    //.bottom( pv.min([node[0][1],node[1][1]]) + Math.abs(node[0][1]-node[1][1])/2 )
                    
                    .font( labelSize + 'px sans-serif')
                    .textStyle( function(){ return label_focus ? "rgba(128, 128, 128, .3)" : 'grey'; })
                    .textAlign("center")
                    .textBaseline("middle")
                    .text( Math.round( node[2][1].Kreuzungswinkel ) + "\u00B0" + ( node[3] ? " | " + node[3] + "" : '' ) );
                    //.text( Math.round( node[2][1].Kreuzungswinkel ) + " deg" + ( node[3] ? " | " + node[3] + "" : '' ) );
            }
        });
        
        vis.render();
        
        vis.add(pv.Dot)
            .data(nodes)
            .left(function(d){ return d[0]; })
            .bottom(function(d){ return d[1]; })
            .size(size)
            .lineWidth( nodeLineWidth )
            .fillStyle("white")
           .anchor("center")
            //.add(pv.Panel) 
             //.fillStyle("none") 
             //.data(["D1","D2","D3"]) 
              //.add(pv.Label) 
              //.top(function(d) this.parent.index * 12 + 18); 
           .add(pv.Label)
            .font( nodeLabelSize + 'px sans-serif')
            .text(function(d){ return d[5]; });
            //.text(function(d){ return d[2] + ' (' + Math.round( d[4].AngleToMembranPlane ) + ')'; });
        
        vis.render();
        
        return false;
    }
};

/**
    @class
 */
var membranePlanes = {
    planes: false,
    color: "blue",
    translucency: 0.6,
    size: 500,
    sizeSelectorId: false,
    visibility: true,
    
    init: function (dataset_id, sizeSelectorId) {
        this.visibility = $("#mplane_visibility").is(':checked');
        this.sizeSelectorId = sizeSelectorId;
        
        // TODO: not elegant
        var mplane_url = "../../datasets/" + dataset_id + "/display/" + (filename ? filename.substring(0,filename.lastIndexOf('.')) + '.mplane' : '') + "?plane=1";
        $("#mplane_size_slider_option").hide();
        //this.size = $("#" + this.sizeSelectorId + " option:selected").val();
        this.size = 500;
        $("#" + this.sizeSelectorId).val(this.size);
        var self = this;
        
        jQuery.getJSON(mplane_url, false, function(data,status) {
            self.planes = data;
            self.draw();
        });
        
        $("#mplane_visibility").bind('change click', function() {
            self.visibility = $("#mplane_visibility").is(':checked');
            self.draw();
        });
        $("#" + this.sizeSelectorId).change( function() {
            self.size = $("#" + self.sizeSelectorId + " option:selected").val();
            $("#mplane_size_slider").slider('option', 'value', self.size);
            $("#mplane_size_slider_option").hide();
            self.draw();
        });
        $("#mplane_size_slider").slider({min: 1, max: 1400, slide: function(event, ui){
            self.size = ui.value;
            self.updateSizeSlider();
        }});
        $("#mplane_size_slider").mousewheel( function(event, delta){
            self.size = Math.round(self.size + 20*delta);
            if(self.size > 1400) self.size = 1400;
            if(self.size < 1) self.size = 1;
            $("#mplane_size_slider").slider('option', 'value', self.size);
            self.updateSizeSlider();
        });
        $("#mplane_size_slider").slider('option', 'value', this.size);
    },
    
    updateSizeSlider: function(){
        if($("#" + this.sizeSelectorId + " option:contains(" + this.size + ")").size()){
            $("#mplane_size_slider_option").hide();
        }else{
            $("#mplane_size_slider_option").show();
            $("#mplane_size_slider_option").val(this.size);
            $("#mplane_size_slider_option").text(this.size);
            
            Array.prototype.sort.call(
                $("#" + this.sizeSelectorId + " option"),
                function(a,b) {
                    return parseInt($(a).val()) >= parseInt($(b).val()) ? 1 : -1;
                }
            ).appendTo("#" + this.sizeSelectorId); 
        }
        $("#" + this.sizeSelectorId).val(this.size);
        this.draw();
    },
    
    draw: function(){
        if(this.visibility){
            jmolScript('draw plane1 color TRANSLUCENT ' + this.translucency + ' ' + this.color + ' plane ' + this.size + ' ' + this.planes[0] + '; draw plane2 color TRANSLUCENT ' + this.translucency + ' ' + this.color + ' plane ' + this.size + ' ' + this.planes[1] + ';');
            
        }else{
            jmolScript('draw p* off;');
        }
    }
}

/**
    @class
 */
var display = {
    styleCmd: 'cartoon ONLY; wireframe 0.015;',
    
    init: function (styleSelectorId) {
        this.styleSelectorId = styleSelectorId;
        
        var self = this;
        $("#" + this.styleSelectorId).change( function() {
            self.setStyle();
        });
    },
    
    setStyle: function (){
        switch($("#" + this.styleSelectorId + " option:selected").val()){
            case 'backbone':
                this.styleCmd = 'backbone ONLY; backbone 0.3;';
                break;
            case 'wireframe':
                this.styleCmd = 'wireframe ONLY; wireframe 0.2;';
                break;
            case 'wireframe+backbone':
                this.styleCmd = 'wireframe ONLY; backbone 0.3; wireframe 0.01;';
                break;
            case 'cartoon+wireframe':
                this.styleCmd = 'cartoon ONLY; wireframe 0.015;';
                break;
            case 'cartoon':
            default:
                this.styleCmd = 'cartoon ONLY;';
                break;
        }
        jmolScript('select all; ' + this.styleCmd);
    }
}

/**
    @class
 */
var interfaces = {
    cutoff: 1.5,
    color: "orange",
    cutoffSelectorId: false,
    interfaceNameSelectorId: false,
    showOnlyInterfacesId: false,
    showOnlyInterfaces: false,
    colorInterfaceResidueId: false,
    colorInterfaceResidue: false,
    atoms: false,
    atoms_url: false,
    interfaceIds: '',
    interfaceNames: '',
    
    init: function (dataset_id, cutoffSelectorId, interfaceNameSelectorId, showOnlyInterfacesId, colorInterfaceResidueId) {
        this.cutoffSelectorId = cutoffSelectorId;
        this.interfaceNameSelectorId = interfaceNameSelectorId;
        this.atoms_url = "../../datasets/" + dataset_id + "/display/" + filename;
        this.showOnlyInterfacesId = showOnlyInterfacesId;
        this.showOnlyInterfaces = $("#" + this.showOnlyInterfacesId).is(':checked');
        this.colorInterfaceResidueId = colorInterfaceResidueId;
        this.colorInterfaceResidue = $("#" + this.colorInterfaceResidueId).is(':checked');
        this.cutoff = $("#" + this.cutoffSelectorId + " option:selected").val();
        this.interfaceNames = $("#" + this.interfaceNameSelectorId + " option:selected").val();
        
        this.getHelixInterfaceNames();
        this.retrieveAtoms();
        this.getFileType();
        
        var self = this;
        $("#" + this.cutoffSelectorId).change( function() {
            self.cutoff = $("#" + self.cutoffSelectorId + " option:selected").val();
            self.retrieveAtoms();
        });
        $("#" + this.interfaceNameSelectorId).change( function() {
            self.interfaceNames = $("#" + self.interfaceNameSelectorId + " option:selected").val();
            self.retrieveAtoms();
        });
        $("#" + self.colorInterfaceResidueId).bind('change click', function(){
            self.colorInterfaceResidue = $("#" + self.colorInterfaceResidueId).is(':checked');
            console.log(self.colorInterfaceResidue);
            self.draw();
        });
        $("#" + self.showOnlyInterfacesId).bind('change click', function(){
            self.showOnlyInterfaces = $("#" + self.showOnlyInterfacesId).is(':checked');
            self.draw();
        });
    },
    getFileType: function (){
        var self = this;
        var url = this.atoms_url + "?get_file_type=1";
        jQuery.getJSON(url, false, function(data) {
            if(data == 'mbn'){
                $("#" + self.interfaceNameSelectorId).prepend("<option value='membrane' selected='selected'>membrane</option>");
            }
        });
    },
    retrieveAtoms: function (){
        var self = this;
        var url = this.atoms_url + "?interface=1&interfaceIds=" + this.interfaceIds + "&interfaceNames=" + this.interfaceNames + "&cutoff=" + this.cutoff
        jQuery.getJSON(url, false, function(data) {
            self.atoms = data;
            self.draw();
        });
    },
    getHelixInterfaceNames: function (){
        var self = this;
        var url = this.atoms_url + "?get_helix_interface_names=1";
        jQuery.getJSON(url, false, function(data) {
            data.sort();
            console.log(data);
            var i = 0;
            $.each(data, function(){
                $("#" + self.interfaceNameSelectorId).append("<option value='" + this + "'>helix " + ++i + "</option>");
            })
        });
    },
    draw: function(){
        var atoms = $.map(this.atoms, function(atom){
            if(atom.asNr == 183) console.log(atom);
            return atom.asNr + ":" + atom.chainId + "." + atom.atomName;
        });
        atoms = atoms.join(',');
        console.log(atoms);
        if(this.colorInterfaceResidue){
            var cmd = 'display all; select all; color grey; select within(GROUP, (' + atoms + ') ); save selection MINTERF; color ' + this.color + ';';
        }else{
            var cmd = 'display all; select all; color grey; select (' + atoms + '); save selection MINTERF; color ' + this.color + ';';
        }
        if(this.showOnlyInterfaces){
            //cmd = cmd + ' restore selection MINTERF; display selected;';
            cmd = cmd + ' display selected; zoom(selected) 100;';
        }
        jmolScript(cmd);
        colorSelectedNodes($("#pdb_tree").dynatree("getTree"));
    }
    
}

/**
    @class
 */
var hbonds = {
    color: "blue",
    showHbondsId: false,
    showHbonds: false,
    hbond_coords: false,
    hbond_coords_url: false,
    
    init: function (dataset_id, showHbondsId, useTmh) {
        //console.log(dataset_id);
        this.hbond_coords_url = "../../datasets/" + dataset_id + "/display/" + filename + "?hbonds=1";
        //console.log(this.hbond_coords_url);
        this.retrieveHbondCoords();
        
        if(showHbondsId){
            var self = this;
            this.showHbondsId = showHbondsId + (useTmh ? '_select' : '_check');
            if(useTmh){
                $("#" + showHbondsId + '_check').hide();
                $("#" + self.showHbondsId).change( function() {
                    self.showHbonds = $("#" + self.showHbondsId + " option:selected").val();
                    self.draw();
                });
            }else{
                $("#" + showHbondsId + '_select').hide();
                this.showHbonds = $("#" + this.showHbondsId).is(':checked');
                $("#" + self.showHbondsId).bind('change click', function(){
                    self.showHbonds = $("#" + self.showHbondsId).is(':checked');
                    self.draw();
                });
            }
        }
    },
    
    retrieveHbondCoords: function (){
        var self = this;
        jQuery.getJSON(this.hbond_coords_url, false, function(data) {
            self.hbond_coords = data;
            if(self.showHbondsId){
                self.draw();
            }
        });
    },
    
    inWhichHelix: function (aa){
        var chain = aa[0];
        var number = aa[1];
        var ret = false;
        $.each(tmhelices.tmh, function(){
            if(this[0][0] == chain && this[1][0] == chain && this[0][1] <= number && this[1][1] >= number){
                ret = this;
                return false; // break
            }
            return true; // continue
        });
        return ret;
    },
    
    draw: function(){
        var self = this;
        wait(
            10,
            function(){
                return tmhelices.tmh || !tmhelices.tmh_url;
            },
            function(){
                self._draw();
            }
        );
    },
    
    _draw: function(){
        if(this.showHbonds){
            //console.log(this.hbond_coords);
            //console.log(tmhelices.tmh);
            var i = 0;
            var hbonds = '';
            var self = this;
            
            jmolScript( 'draw hbond* off' );
            interfaces.draw();
            display.setStyle();
            if(self.showHbonds == 'interhelical'){
                $.each(this.hbond_coords, function(){
                    var tmh_a = self.inWhichHelix( this[2] );
                    var tmh_b = self.inWhichHelix( this[3] );
                    if(tmh_a && tmh_b && tmh_a != tmh_b){
                        hbonds += 'draw hbond_inter' + i + ' color ' + self.color + ' {' + this[0] + '} {' + this[1] + '};';
                        hbonds += 'select ' + this[2][1] + ':' + this[2][0] + ',' + this[3][1] + ':' + this[3][0] + '; color lightgreen; cartoon ONLY; wireframe 0.1;';
                        i = i+1;
                    }
                });
            }else{
                $.each(this.hbond_coords, function(){
                    hbonds += 'draw hbond_all' + i + ' color ' + self.color + ' {' + this[0] + '} {' + this[1] + '};';
                    hbonds += 'select ' + this[2][1] + ':' + this[2][0] + ',' + this[3][1] + ':' + this[3][0] + '; color lightgreen; cartoon ONLY; wireframe 0.1;';
                    i = i+1;
                });
            }
            //console.log(hbonds);
            jmolScript(hbonds);
        }else{
            jmolScript( 'draw hbond* off' );
            interfaces.draw();
            display.setStyle();
        }
    }
}


/**
    @class
 */
var tmhelices = {
    tmh: false,
    tmh_url: false,
    
    init: function (dataset_id) {
        this.tmh_url = "../../datasets/" + dataset_id + "/display/" + filename + "?json=1";
        this.retrieveTmh();
    },
    retrieveTmh: function (){
        var self = this;
        jQuery.getJSON(this.tmh_url, false, function(data) {
            self.tmh = data;
            //console.log( self.tmh );
        });
    }
}

/**
    @class
 */
var clipping = {
    
    depth: 0,
    slab: 100,
    state: false,
    
    init: function(){
        this.state = $("#clipping_state").is(':checked');
        this.update();
        
        var self = this;
        
        $("#clipping_state").bind('change click', function(){
            self.state = $("#clipping_state").is(':checked');
            self.update();
        });
        $("#clipping_slider").slider({
            values: [this.depth, this.slab],
            range: true,
            min: 0, max: 100,
            slide: function(event, ui){
                //console.log(ui, ui.values);
                self.depth  = ui.values[0];
                self.slab= ui.values[1];
                self.update();
            }
        });
        $("#clipping_slider").mousewheel( function(event, delta){
            //console.log(event, delta);
            self.slab = Math.round(self.slab + 2*delta);
            self.depth = Math.round(self.depth + 2*delta);
            if(self.slab > 100) self.slab = 100;
            if(self.slab < 0) self.slab = 0;
            if(self.depth > 100) self.depth = 100;
            if(self.depth < 0) self.depth = 0;
            $("#clipping_slider").slider('values', 0, self.depth);
            $("#clipping_slider").slider('values', 1, self.slab);
            self.update();
        });
        //$("#clipping_slider").slider('option', 'values', [this.depth, this.slab]);
    },
    
    update: function(){
        //console.log(this.depth, this.slab);
        if(this.state){
            jmolScript('slab on;');
        }else{
            jmolScript('slab off;');
        }
        jmolScript('depth ' + this.depth + '; slab ' + this.slab + ';');
    }
}