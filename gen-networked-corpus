#!/usr/bin/python

import codecs
import gzip
import json
import math
import numpy
import optparse
import os
import re
import scipy.stats
import shutil
import sys

# Displayed in the usage message.
description_text = \
'Generate an annotated HTML version of a corpus based on a MALLET topic model.'

# Preface of the generated HTML files.
html1 = '''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
 <head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <script src="docs_by_topic.js"></script>
  <script src="topic_names.js"></script>
  <script src="doc_names.js"></script>
  <script src="extracts.js"></script>
  <script src="jquery.js"></script>
  <script src="protovis.min.js"></script>
  <script src="protovis-msie.min.js"></script>
  <script src="common.js"></script>
  <script src="browser.js"></script>
  <link rel="stylesheet" type="text/css" href="browser.css"></link>
  <title>{0}</title>
 </head>
 <body>
  <div id="header">
    <div style="float:left">
      {1}:
      <br />
      {0}
      <br />
      Return to:
      <a href="index.html">Document index</a> |
      <a href="topic-index.html">Topic index</a>
    </div>
    <div id="top-topic-area" style="float:right">
    </div>
  </div>
  <div id="main-area">
'''

# End of the generated HTML files.
html2 = '''
  </div>
 </body>
</html>
'''

# Preface of the generated index file.
index_html1 = '''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
 <head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <link rel="stylesheet" type="text/css" href="index.css"></link>
  <title>Networked Corpus Index</title>
 </head>
 <body>
  <div id="header">
    <div style="float:left">
      Document index |
      <a href="topic-index.html">Topic index</a>
    </div>
    <div id="top-topic-area" style="float:right">
    </div>
  </div>
  <div id="main-area">
    <table id="text-table">
'''

# End of the generated index file.
index_html2 = '''
    </table>
  </div>
 </body>
</html>
'''

# Preface of the generated topic index file.
topic_index_html1 = '''<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
 <head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <script src="docs_by_topic.js"></script>
  <script src="topic_names.js"></script>
  <script src="doc_names.js"></script>
  <script src="extracts.js"></script>
  <script src="jquery.js"></script>
  <script src="common.js"></script>
  <script src="index.js"></script>
  <link rel="stylesheet" type="text/css" href="index.css"></link>
  <title>Networked Corpus Index</title>
  <script>
this_doc = null;
  </script>
 </head>
 <body>
  <div id="header">
    <div style="float:left">
      <a href="index.html">Document index</a> |
      Topic index
    </div>
    <div id="top-topic-area" style="float:right">
    </div>
  </div>
  <div id="main-area">
    <table id="text-table">
'''

# End of the generated topic index file.
topic_index_html2 = '''
    </table>
  </div>
 </body>
</html>
'''

# List of files to copy to the output directory (from the directory in
# which the script resides).
resource_files = ['browser.css', 'index.css',
                  'common.js', 'browser.js', 'index.js',
                  'jquery.js', 'protovis.min.js', 'protovis-msie.min.js',
                  'notch-left.png']

def tokenize(s):
    # A horrible hack to get around the fact that Python's RE engine
    # can't easily match (unicode) alphabetical characters only.
    sprime = re.sub('([^\w]|[0-9_])', '\x00\\1\x00', s,
                    flags=re.UNICODE)
    return re.split('\x00+', sprime, flags=re.UNICODE)

def truncate(f):
    # Replace very small numbers with 0.  We do this because SVG can't
    # parse floating point numbers with 3-digit exponents in paths (?).
    if abs(f) < 1.0e-5:
        return 0.0
    return f

def alphanumeric_sort(l): 
    # Sort alphabetically, but handle multi-digit numbers correctly.
    return sorted(l, key=lambda s: [int(x) if x.isdigit() else x
                                    for x in re.split('([0-9]+)', s)] )

def gen_annotations(indir, in_doc_topics, in_topic_keys, in_topic_state,
                    outdir, min_topic_appearances, min_pointedness,
                    num_words_per_topic, resdir, bandwidth):

    topic_state = {}
    topic_appearances_by_doc = {}
    top_topics_by_doc = {}
    docs_by_topic = {}
    top_words_by_topic = {}

    # Load 'stopwords.txt' from the resource directory.
    stopwords_file = open(os.path.join(resdir, 'stopwords.txt'))
    stopwords = stopwords_file.read().split(' ')
    stopwords_file.close()

    # Load the data from the MALLET topic-state file.
    f = gzip.open(in_topic_state, 'r')
    f.readline(); f.readline(); f.readline()
    for line in f.readlines():
        line = unicode(line, 'utf-8').strip()
        docnum, doc, pos, wordtypeindex, wordtype, topic = line.split(' ')
        topic = int(topic)
        doc = os.path.split(doc)[-1]
        topic_state.setdefault(doc, []) \
            .append((wordtype, topic))
        topic_appearances_by_doc.setdefault(doc, set()).add(topic)

    # Load the data from the MALLET doc-topic file
    f = open(in_doc_topics, 'r')
    f.readline()
    for line in f.readlines():
        line = line.split('\t')
        doc = line[1].split('/')[-1].replace('%20', ' ').replace('%3F', '?')
        top_topics_by_doc[doc] = []
        line = line[2:]
        ntopics = len(line) / 2
        if ntopics > 9:
            ntopics = 9;
        for i in xrange(0, ntopics):
            topic = int(line[i*2])
            coef = float(line[i*2 + 1])
            # Only include topics that account for at least one word.
            if topic in topic_appearances_by_doc[doc]:
                top_topics_by_doc[doc].append(topic)
                docs_by_topic.setdefault(topic, []).append(doc)

    # Load the data from the MALLET topic-keys file.
    f = codecs.open(in_topic_keys, 'r', 'utf-8')
    for line in f.readlines():
        line = line.strip()
        topic, n, words = line.split('\t') # What is the second value?
        topic = int(topic)
        top_words_by_topic[topic] = words.split(' ')[:num_words_per_topic]

    # Create the output directory (if necessary).
    if not os.path.exists(outdir):
        os.makedirs(outdir)
    elif not os.path.isdir(outdir):
        print >>sys.stderr, ("Error: '{0}' exists but is not a directory!"
                             .format(outdir))
        exit()

    # Generate and save topic names.
    topic_names = dict([(topic, ' '.join(top_words_by_topic[topic]
                                         [:num_words_per_topic]))
                        for topic in top_words_by_topic])
    outf = open(os.path.join(outdir, 'topic_names.js'), 'w')
    outf.write('topic_names = ' + json.dumps(topic_names) + ';\n')

    # Convert the individual documents to HTML and add annotations,
    # also saving the text of the lines where the link for a given
    # topic will plant you in the document, and getting a list of the
    # documents with links for each topic.
    extracts = {}
    firstlines = {}
    pointed_topics_by_doc = {}
    docs_by_pointed_topic = {}
    for doc in os.listdir(indir):
        state = list(topic_state[doc])
        pointed_topics_by_doc[doc] = []

        f = codecs.open(os.path.join(indir, doc), 'r', 'utf-8')
        text = f.read()
        f.close()
        lines = text.split(u'\n')
        nlines = len(lines)
        firstlines[doc] = lines[0]
        line_toks = [tokenize(line) for line in lines]

        # Scour the topic state to find the topic assignments for each
        # token in this document.  Also save the line numbers on which
        # words associated with each of the top topics appear.
        line_toks_annotated = []
        topic_appearances = {}
        ntoks = 0
        for i, toks in enumerate(line_toks):
            ntoks += len(toks)
            toks_annotated = []
            for tok in toks:
                match_tok = tok.lower()
                if match_tok.isalpha() and match_tok not in stopwords:
                    wordtype, topic = state.pop(0)
                    if wordtype != match_tok:
                        print(doc, 'line', i, ': expected', wordtype,
                              'found', match_tok)
                        exit()
                else:
                    topic = None
                toks_annotated.append((tok, topic))
                topic_appearances.setdefault(topic, []) \
                    .append(i)
            line_toks_annotated.append(toks_annotated)

        # Compute estimates of the density of each top topic over the
        # lines of the document, and identify which topics are 'pointed'.
        topic_density_fcns = {}
        topic_density_maxima = {}
        for topic in top_words_by_topic:
            if not (topic in top_topics_by_doc[doc]
                    or topic in pointed_topics_by_doc[doc]):
                continue
            appearances = [float(x) for x in topic_appearances[topic]]
            try:
                # Compute the KDE if possible.
                kde = scipy.stats.gaussian_kde(appearances)
            except ValueError:
                continue
            except numpy.linalg.linalg.LinAlgError:
                continue
            # SciPy lets you set a bandwidth adjustment factor that gets 
            # squared and multiplied by the variance of the data to determine
            # the actual bandwidth.  We want to set the bandwidth directly,
            # so we need to work around this.
            kde.set_bandwidth(1.0)
            kde.set_bandwidth(math.sqrt(bandwidth / float(kde.covariance[0])))
            topic_density_fcns[topic] = [truncate(kde(float(i))[0])
                                         for i in xrange(nlines)]
            # Identify 'pointed' topics.
            if len(appearances) < min_topic_appearances:
                continue
            maximum = numpy.argmax(topic_density_fcns[topic])
            mean = float(kde.integrate_box_1d(0.0, nlines - 1.0)) \
                / nlines
            if topic_density_fcns[topic][maximum] \
                    > mean * min_pointedness:
                topic_density_maxima.setdefault(maximum, []).append(topic)
                pointed_topics_by_doc[doc].append(topic)
                docs_by_pointed_topic.setdefault(topic, []).append(doc)
    
        # Create an HTML document with all of the words associated with
        # top topics marked as such, and annotations added to the lines
        # of greatest density for each top topic.
        outf = codecs.open(os.path.join(outdir, doc + '.html'), 'w', 'utf-8')
        outf.write(html1.format(firstlines[doc], doc))
        # Save the density functions.
        outf.write('<script>\n')
        outf.write('density_fcns = ' + json.dumps(topic_density_fcns) + ';\n')
        outf.write('this_doc = "' + doc + '";\n')
        outf.write('top_topics = ' + json.dumps(top_topics_by_doc[doc]) + ';\n')
        outf.write('</script>\n')
        outf.write('<table id="text-table">')
        extracts[doc] = {}
        for i, toks in enumerate(line_toks_annotated):
            if i == 0:
                outf.write('<tr class="first-row"><td class="text-line">')
            elif i == nlines - 1:
                outf.write('<tr class="last-row"><td class="text-line">')
            else:
                outf.write('<tr><td class="text-line">')
            if i in topic_density_maxima:
                for topic in topic_density_maxima[i]:
                    outf.write('<a name="topic' + str(topic) + '">')
                    if len(toks) == 1 and toks[0][0] == u'':
                        # Avoid pulling blank lines as extracts.
                        if i < len(line_toks_annotated) - 1:
                            extract_toks = line_toks_annotated[i + 1]
                        else:
                            extract_toks = line_toks_annotated[i - 1]
                    else:
                        extract_toks = toks
                    extracts[doc][topic] = ''.join(tok for tok, topic
                                                   in extract_toks)
            for tok, topic in toks:
                if topic in top_topics_by_doc[doc] \
                        or topic in pointed_topics_by_doc[doc]:
                    outf.write('<span class="topic' + str(topic) + '">' +
                               tok + '</span>')
                else:
                    outf.write(tok)
            if i in topic_density_maxima:
                for topic in topic_density_maxima[i]:
                    outf.write('</a>')
            if i == 0:
                outf.write('&nbsp;</td><td rowspan="'
                           + str(nlines + 1)
                           + '" id="chart-cell" valign="top">'
                           + '<div id="chart-area"><div id="chart">'
                           + '</div></div></td>'
                           + '<td class="marginal-link-cell">')
            else:
                outf.write('&nbsp;</td><td class="marginal-link-cell">')
            if i in topic_density_maxima:
                for topic in topic_density_maxima[i]:
                    outf.write('<span class="marginal-link" id="'
                               + str(topic) + '"></span>')
            if i == 0:
                outf.write('</td><td valign="top" rowspan="'
                           + str(nlines)
                           + '" id="popup-cell">'
                           + '<div id="popup-area"></div></td></tr>\n')
            else:
                outf.write('</td></tr>\n')

        outf.write('</table>')
        outf.write(html2)

    # Sort the lists of top docs.
    for topic in docs_by_topic:
        d = docs_by_topic[topic]
        docs_by_topic[topic] = alphanumeric_sort(d)
    for topic in docs_by_pointed_topic:
        d = docs_by_pointed_topic[topic]
        docs_by_pointed_topic[topic] = alphanumeric_sort(d)

    # Save the list of documents to display for each topic.
    outf = open(os.path.join(outdir, 'docs_by_topic.js'), 'w')
    outf.write('docs_by_pointed_topic = ' + json.dumps(docs_by_pointed_topic) + ';\n')
    outf.write('docs_by_topic = ' + json.dumps(docs_by_topic) + ';\n')

    # Save the list of document names
    outf = open(os.path.join(outdir, 'doc_names.js'), 'w')
    outf.write('doc_names = ' + json.dumps(firstlines) + ';\n')

    # Save the extracts.
    outf = codecs.open(os.path.join(outdir, 'extracts.js'), 'w', 'utf-8')
    outf.write('extracts = ' + json.dumps(extracts) + ';\n')

    # Create the index file.
    outf = codecs.open(os.path.join(outdir, 'index.html'), 'w', 'utf-8')
    outf.write(index_html1)
    docs = alphanumeric_sort(os.listdir(indir))
    ndocs = len(docs)
    for i, doc in enumerate(docs):
        if i == 0:
            outf.write('<tr class="first-row">')
        elif i == ndocs - 1:
            outf.write('<tr class="last-row">')
        else:
            outf.write('<tr>')
        outf.write('<td class="index-entry"><a href="' + doc
                   + '.html">' + doc + '</a>: '
                   + firstlines[doc] + '</td></tr>')
    outf.write(index_html2)

    # Create the topic index file.
    outf = codecs.open(os.path.join(outdir, 'topic-index.html'), 'w', 'utf-8')
    outf.write(topic_index_html1)
    topic_list = sorted(top_words_by_topic.keys())
    ntopics = len(topic_list)
    for i, topic in enumerate(topic_list):
        if i == 0:
            outf.write('<tr class="first-row">')
        elif i == ntopics - 1:
            outf.write('<tr class="last-row">')
        else:
            outf.write('<tr>')
        outf.write('<td class="index-entry" id="' + str(topic)
                   + '"><a class="topic-link" '
                   + 'href="javascript:show_index_popup('
                   + str(topic) + ')">Topic ' + str(topic) + '</a>: '
                   + topic_names[topic].encode('ascii', 'xmlcharrefreplace')
                   + '</td>')
        if i == 0:
            outf.write('<td valign="top" rowspan="' + str(ntopics + 1)
                       + '" id="popup-cell"><div id="popup-area"></div></td>')
        outf.write('</tr>')
    outf.write(topic_index_html2)

    # Copy the resource files to the output directory.
    for filename in resource_files:
        shutil.copy(os.path.join(resdir, filename), outdir)


if __name__ == '__main__':
    parser = optparse.OptionParser(description=description_text,
                                   usage='%prog --input-dir=INDIR'
                                   '--output-dir=OUTDIR [options]')

    parser.add_option('--input-dir', dest='indir', action='store',
                      help='directory containing text files')

    parser.add_option('--input-doc-topics', dest='in_doc_topics',
                      action='store', default='doc_topics.txt',
                      help="location of the 'doc-topics' file from"
                      " MALLET (default 'doc_topics.txt')")

    parser.add_option('--input-topic-keys', dest='in_topic_keys',
                      action='store', default='topic_keys.txt',
                      help="location of the 'topic-keys' file from"
                      " MALLET (default 'topic_keys.txt')")

    parser.add_option('--input-topic-state', dest='in_topic_state',
                      action='store', default='topic_state.gz',
                      help="location of the 'topic-state' file from"
                      " MALLET (default 'topic_state.gz')")

    parser.add_option('--output-dir', dest='outdir', action='store',
                      help='directory in which to deposit the HTML files')

    parser.add_option('--word-cutoff', dest='min_topic_appearances',
                      type=float, action='store', default=25,
                      help='minimum number of words a topic must contribute'
                      ' to a document to be linked (default 25)')

    parser.add_option('--pointedness-cutoff', dest='min_pointedness',
                      type=float, action='store', default=4.0,
                      help='minimum ratio of maximum : average density'
                      ' for a link to be established (default 4.0)')

    parser.add_option('--words-per-topic', dest='num_words_per_topic',
                      type=int, action='store', default=10,
                      help='number of words per topic to display (default 10)')

    parser.add_option('--kde-bandwidth', dest='bandwidth',
                      type=float, action='store', default=6.0,
                      help='amount of smoothing to apply to the density'
                      ' functions (default 6.0)')

    (options, args) = parser.parse_args()

    if not (options.indir and options.outdir):
        parser.error('--input-dir and --output-dir must be specified!')

    gen_annotations(resdir=os.path.join(sys.path[0], 'res'),
                    **options.__dict__)
