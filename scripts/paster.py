"""
Bootstrap the Protein-Viewer.

This should not be called directly!  Use the run.sh script in Protein-Viewer's
top level directly.
"""

import os, sys

new_path = [ os.path.join( os.getcwd(), "app", "lib" ) ]
new_path.extend( sys.path[1:] ) # remove scripts/ from the path
sys.path = new_path

from paste.script import command
command.run()
