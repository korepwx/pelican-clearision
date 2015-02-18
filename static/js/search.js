$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

function initSearch(query_url, query_key, prev_label, next_label) {
  $(document).ready(function () {
    // backup the old messages
    var waiting_message = $('#results').html();
    var no_query_message = $('#no_query_string').html();
    var no_result_message = $('#no_result_string').html();
    var service_unavailable_message = $('#service_unavailable_string').html();
    var unrelated_removed_message = $('#unrelated_removed_string').html();

    // template strings
    var article_template = '<article class="post"><hgroup class="post_hctn"><div class="post_h_l"><h2 class="post_h"><a href="{link}" target="_blank">{title}</a></h2></div></hgroup><div class="post_t">{summary}</div></article>';
    var pagination_template = '';

    function mkpagelink(classes, pageid, label) {
      label = label || pageid;
      return '<a class="page-numbers ' + classes + '" href="javascript:$.doQuery(' + pageid + ');">' + label + '</a>';
    }
    function mkpagespan(classes, label) {
      return '<span class="page-numbers ' + classes + '">' + label + '</span>';
    }

    // get the query string
    var query = decodeURIComponent($.getUrlVars()[query_key] || "");
    if (!query) {
      $('#results').html(no_query_message);
      return;
    }

    document.title = query + ' - ' + document.title.split(' - ')[1];
    $('#tr_search').val(query);

    // now create the search function
    var this_page = null;

    var doQuery = function(page) {
      var qUrl = (query_url.replace('{page}', page)
                  .replace('{query}', encodeURIComponent(query)));
      this_page = page;
      $('#results').html(waiting_message);
      $.ajax({
        url: qUrl,
        jsonp: "callback",
        dataType: "jsonp",
        success: function(response) {
          dealResult(response);
        }
      });
    };

    // Deal with the returned results
    var dealResult = function(response) {
      // Any error raised?
      if (!response || response.error != 0) {
        $('#results').html(service_unavailable_message);
        return;
      }

      // No result?
      if (!response.results.length && !response.estimated_results) {
        $('#results').html(no_result_message);
        return;
      }

      // Now construct the result chunks
      var results = [];
      $(response.results).each(function(i, e) {
        var title = e.title;
        var summary = e.content;
        results.push(article_template.replace('{title}', title)
                     .replace('{link}', e.link)
                     .replace('{summary}', summary));
      });

      // detect the pagination settings
      var pagenum = (results.length > 0) ? response.estimated_pages : this_page;
      if (results.length == 0) {
        results.push(unrelated_removed_message);
      }

      // The pagination
      var pagination = [];
      if (response.estimated_pages > 1) {
        pagination.push('<div id="page_nav">');
        var start_page = this_page - 5;
        if (start_page <= 2) {
          start_page = 1;
        }
        var end_page = start_page + 9;
        if (end_page > pagenum) {
          end_page = pagenum;
          start_page = end_page - 9;
          if (start_page <= 2) {
            start_page = 1;
          }
        }

        // prev page
        if (this_page > 1) {
          pagination.push(mkpagelink('prev', this_page-1, prev_label));
        }

        // first page
        if (start_page > 1) {
          pagination.push(mkpagelink('', 1));
          pagination.push('<span>...</span>');
        }

        // inter pages
        for (var idx=start_page; idx<=end_page; ++idx) {
          if (idx == this_page) {
            pagination.push(mkpagespan('current', idx));
          } else {
            pagination.push(mkpagelink('', idx, idx));
          }
        }

        // last page
        if (end_page < pagenum) {
          if (end_page < pagenum - 1) {
            pagination.push('<span>...</span>');
          }
          pagination.push(mkpagelink('', pagenum));
        }

        // next page
        if (this_page < pagenum) {
          pagination.push(mkpagelink('next', this_page+1, next_label));
        }

        pagination.push('</div>');
      }

      $('#results').html(results.join("\n") + pagination.join('\n'));
    }

    $.extend({doQuery: doQuery});

    // Finally, we emit such a request
    doQuery(1);
  });
}