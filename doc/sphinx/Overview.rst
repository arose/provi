==========
 Overview
==========


Architecture
============

.. digraph:: foo

   "Viewer (browser-based)" -> "Controller (Python module)" -> "Datasource (Galaxy, Upload, ...)";
   "Controller (Python module)" -> "Viewer (browser-based)";
