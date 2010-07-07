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

    Paste PasteScript webob weberror Routes Beaker simplejson Pygments
    

Galaxy
======

to use it with Galaxy/Membrane Proteins add something like the following to galaxy's universe_wsgi.ini::
    
    # protein-viewer url
    protein_viewer_url = http://localhost:7070/static/html/provi.html


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

