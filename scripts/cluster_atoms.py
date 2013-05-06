
from hcluster import pdist, linkage, dendrogram, fcluster, fclusterdata
import numpy
from numpy.random import rand
import csv
import sys
from collections import defaultdict








rhodopsin_water = csv.reader( open('../data/rhodopsin_water.csv', 'rb'), delimiter=',', quotechar='"' )

water_dict = {}
water_list = []
for row in rhodopsin_water:
    row = [ d.strip() for d in row ]
    if row[0]:
        for i in [1,5]:
            row[i] = int( row[i] )
        for i in [6,7,8,9,10]:
            row[i] = float( row[i] )
        water_dict[ (row[12], row[5]) ] = row
        water_list.append( row )


X = [ row[6:9] for row in water_list ]
print X
Y = pdist(X, 'euclidean')

Z = linkage(Y, 'average')
print Z
dendrogram(Z)

fclust = fcluster(Z, 2, criterion='distance')


clust_dict = defaultdict( list )
for i, row in enumerate(water_list):
    #print fclust[i], str(fclust[i])
    clust_dict[ str(fclust[i]) ].append( row )

#print clust_dict

for c in clust_dict:
    print 'select water and (' + ' or '.join( [ '(~' + w[12] + ' and ' + str(w[5]) + ')' for w in clust_dict[c] ] ) + '); isosurface id "foo' + c + '" color lightblue center {selected} SPHERE @{ [ {selected}.x.stddev, {selected}.y.stddev, {selected}.z.stddev, 0.5  ].max *2 } translucent' + ';'


sys.exit(0)

from Bio import Cluster
lines = "Start\tX\tY\tZ\n" + "\n".join( [ "\t".join( [ row[12] + "|" + str(row[5]), str(row[6]), str(row[7]), str(row[8]) ] ) for row in water_list ] ) + "\n"

import StringIO
handle = StringIO.StringIO(lines)
record = Cluster.read(handle)
tree = record.treecluster( method="c", dist="e" )
record.save( '../data/test_tree', tree )


print tree