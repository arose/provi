==============
 Installation
==============


Python packages
===============

mind the order, numpy is best installed before biopython

::

    argparse unipath numpy biopython

::
    
    MembraneProtein

::

    Paste PasteScript webob weberror Routes Beaker simplejson Pygments poster
    

Galaxy
======

to use it with Galaxy/Membrane Proteins add something like the following to galaxy's universe_wsgi.ini::
    
    # protein-viewer url
    protein_viewer_url = http://localhost:7070/static/html/provi.html


Example integration into a (normal) Galaxy instance
---------------------------------------------------

Create new config variable:

.. code-block:: diff

    Index: /Users/alexrose/Documents/uni/charite/development/repositories/galaxy_dist-dev/lib/galaxy/config.py
    --- a/lib/galaxy/config.py	Thu Jul 01 19:12:24 2010 +0200
    +++ b/lib/galaxy/config.py	Tue Jul 06 16:45:06 2010 +0200
    @@ -90,6 +90,7 @@
             self.bugs_email = kwargs.get( 'bugs_email', None )
             self.blog_url = kwargs.get( 'blog_url', None )
             self.screencasts_url = kwargs.get( 'screencasts_url', None )
    +        self.protein_viewer_url = kwargs.get( 'protein_viewer_url', 'http://localhost:7070/static/html/provi.html' )
             self.library_import_dir = kwargs.get( 'library_import_dir', None )
             if self.library_import_dir is not None and not os.path.exists( self.library_import_dir ):
                 raise ConfigurationError( "library_import_dir specified in config (%s) does not exist" % self.library_import_dir )
    
Add a display application to a pdb datatype::

    class PDB( data.Text ):
        """PDB"""
        file_ext = "pdb"
        def __init__(self, **kwargs):
            super(PDB, self).__init__(**kwargs)
            self.add_display_app( 'provi', '', '', 'provi_link' )
        def provi_link( self, dataset, type, app, base_url ):
            url =  '%s?galaxy[0][id]=%s&galaxy[0][name]=%s&galaxy[0][type]=pdb' % (app.config.protein_viewer_url, dataset.id, dataset.name)
            return [('Provi', url)]

For a definition of the URL GET format see the `Provi API documentation: <../../jsdoc/symbols/Provi.Data.Io.Get.html>`_


Jmol (client-side)
==================

Giving JmolApplet more memory to work with
------------------------------------------

from http://wiki.jmol.org/index.php?title=Jmol_Applet#Giving_JmolApplet_more_memory_to_work_with

Memory available to Jmol is determined by Java. You can check the current memory allocation by opening the pop-up menu in the applet, and the last submenu "About Jmol".

Less or more memory can be allocated by using this parameter::

    -Xmx###M

where the ### must be substituted by a number in megabytes (hence the "M" after it). However, the amount of memory that can be allocated is limited by your existing RAM. For example, on a system with 512 MB RAM, a maximum of 256 MB is allowed for Java.

Examples:

    * -Xmx512M will give 512 Mb maximum memory available.
    * -Xmx1024M will give 1024 Mb maximum memory available. 

The place to set this parameter is:

    Windows: 

        Control Panel > Java icon (opens the Java Control Panel) > "Java" tab > "Applet run-time configuration" > "Show" button > on row "JRE" (latest version if there are several), click on the textbox under "Parameters" and type: -Xmx###M 

    Macintosh: 

        Under /Applications/Utilities/Java/J2SE 5.0/Java Preferences, look for the place to put the -Xmx###M 
        Or look in the Java Control Panel. 

