The Networked Corpus
===============

The Networked Corpus provides a way of navigating a collection of texts using a topic model.  It consists of a Python script that takes in a directory full of plain text files and a topic model computed using [MALLET](http://mallet.cs.umass.edu), and generates a collection of HTML files that you can use in your browser.

Project Web site: [networkedcorpus.com](http://networkedcorpus.com)

The Networked Corpus is under the MIT license.  This package incorporates [Protovis 3.3.1](http://mbostock.github.com/protovis), the [Protovis MSIE shim](http://github.com/DataMarket/protovis-msie), and [jQuery 1.3.2](http://jquery.com).  Protovis is under the BSD license; the MSIE shim and jQuery are dual-licenced under the MIT and GPL version 2 licenses.

# Prerequisites

To use this script, you will need to have the following software installed:

* Python 2.7.x (available at [python.org](http://python.org))
* NumPy version 1.6.2 or greater (available at [numpy.org](http://numpy.org))
* SciPy version 0.11.0 or greater (available at [scipy.org](http://scipy.org))
* MALLET 2.0.7 or greater (available at [mallet.cs.umass.edu](http://mallet.cs.umass.edu))

These instructions assume that all of this software is installed and working, and that you know how to run executable files from the command line.

# Preparing the texts

The first step is to get the texts into the right format.  Each text in your collection will need to be in a separate plain text file, ASCII or UTF-8 encoded.  A "text" might be defined as an issue of a periodical, a book, a letter, or, if you are working with a single book, a chapter; however, we have found that topic modeling does not work very well when applied to the chapters of a single novel.  The files should all be in the same directory, and the directory should not contain anything else.

The text files must have hard line breaks at the end of each line.  This is used to calculate how far down the page a word occurs, and also affects how wide the text will appear in the browser.  If your source documents do not have line breaks and you are on a Mac or Linux system, you can use the 'fold' command to wrap them automatically.  It doesn't matter whether the line breaks are Unix or DOS-style.

Finally, the first line of each file should be a title; this will be used in the table of contents and in a few other places.

# Generating the Networked Corpus

The first thing you need to do is run MALLET to generate a topic model.  This is done in two steps.  First, you must convert the directory full of text files into a MALLET data file.  You can do this like this (assuming that "mallet" is the command that you use to run MALLET):

    mallet import-dir --input <DIRECTORY CONTAINING FILES> --output corpus.mallet --keep-sequence --remove-stopwords --token-regex '[\p{L}\p{M}]+'

The "--token-regex" option is necessary to get MALLET to handle Unicode correctly.

Next, run MALLET's machine learning algorithm to create a topic model:

    mallet train-topics --input corpus.mallet --num-topics 100 --output-state topic_state.gz --output-topic-keys topic_keys.txt --output-doc-topics doc_topics.txt 

This may take a few minutes to run.  Feel free to play with the settings at this stage - in particular, the ideal number of topics may differ significantly from corpus to corpus.

Finally, run the Networked Corpus script.  If you are in the directory that contains the 'topic_state.gz', 'topic_keys.txt', and 'doc_topics.txt' files, you can just do it like this (assuming that "gen-networked-corpus" is the path to the script):

    gen-networked-corpus --input-dir <DIRECTORY CONTAINING FILES> --output-dir <OUTPUT DIRECTORY>

This will create a bunch of HTML files in the output directory, as well as copying the necessary JavaScript, CSS, and image files.  You can then open "index.html" in your browser, and start playing with the results.

The Networked Corpus script has a few options that you can adjust.  To see a list of them, run:

    gen-networked-corpus --help

Enjoy!