/*
    BeepBeep Console, an Ajax front-end for the BeepBeep monitor
    Copyright (C) 2013 Sylvain Hallé

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var timer_started = false;
var timer_poll_interval = 2000;
var proxy_prefix = "/beepbeep";

$.ajaxSetup({ scriptCharset: "utf-8" , contentType: "application/json; charset=utf-8"});

window.onload = function()
{
  $("#status-light-inside").show().fadeOut(1500);
  $("#btn-refresh").click(function()
  {
    refresh_monitors();
    return false;
  });
  $("#btn-autopoll").click(function()
  {
    if (timer_started == true)
    {
      $("#btn-autopoll").removeClass("btn-autopoll-started");
      timer_started = false;
    }
    else
    {
      $("#btn-autopoll").addClass("btn-autopoll-started");
      timer_started = true;
      poll_monitor();
    }
  });
  $("#btn-add-monitor").click(function()
  {
    add_monitor();
  });
  $("#btn-reset-monitors").click(function()
  {
    reset_monitors();
  });
  $("#poll-interval-slider").slider({"min": 1, "max": 5, "value" : 3, "change": poll_interval_slide_change});
  $("#proxy_prefix").val(proxy_prefix);
  set_handlers();
}

handle_xhr_error = function(jqXHR, textStatus)
{
  if (timer_started == true)
    $("#btn-autopoll").trigger('click'); // Stop auto-poll
  alert( "Request failed: " + textStatus );
}

function poll_interval_slide_change(event, ui)
{
  var out = "½ s";
  if (ui.value == 1)
  {
    out = "½ s";
    timer_poll_interval = 500;
  }
  else if (ui.value == 2)
  {
    out = "1 s";
    timer_poll_interval = 1000;
  }
  else if (ui.value == 3)
  {
    out = "2 s";
    timer_poll_interval = 2000;
  }
  else if (ui.value == 4)
  {
    out = "10 s";
    timer_poll_interval = 10000;
  }
  else if (ui.value == 5)
  {
    out = "1 min.";
    timer_poll_interval = 60000;
  }
  $("#poll-interval").html(out);
}

function set_handlers()
{
  $('.ltlfo-block')
  .mouseover(function(event) {
    add_to_parent($(event.target));
  })
  .mouseout(function(event) {
    remove_to_parent($(event.target));
  })
  .click(function(event) {
    $(event.target).toggleClass('ltlfo-outline-element-clicked');
  });
  $('.btn-expand-collapse').click(function(e)
  {
    $(e.target).toggleClass("expanded");
    $(e.target).parent().find(".monitor-details").toggle();
  });
}

function add_to_parent(e)
{
  if (e.hasClass('ltlfo-block'))
  {
    e.addClass('ltlfo-outline-element');
    return;
  }
  add_to_parent(e.parent());
}

function remove_to_parent(e)
{
  if (e.hasClass('ltlfo-block'))
  {
    e.removeClass('ltlfo-outline-element');
    return;
  }
  remove_to_parent(e.parent());
}

function reset_monitors()
{
  $.ajax({
    url: proxy_prefix + '/monitor',
    type: 'POST',
    success: function(result)
    {
      refresh_monitors();
    },
    error: handle_xhr_error
  });
  return false;
}

function reset_monitor(caption)
{
  $.ajax({
    url: proxy_prefix + '/monitor?Caption=' + caption,
    type: 'POST',
    success: function(result)
    {
      refresh_monitors();
    },
    error: handle_xhr_error
  });
  return false;
}

function delete_monitor(caption)
{
  $.ajax({
    url: proxy_prefix + '/monitor?Caption=' + caption,
    type: 'DELETE',
    success: function(result)
    {
      refresh_monitors();
    },
    error: handle_xhr_error
  });
  return false;
}

function refresh_monitors()
{
  $("#status-light-inside").show().fadeOut(1500);
  $.ajax({
    url: proxy_prefix + '/monitor',
    type: 'GET',
    success: function(result)
    {
      var html_output = "";
      var odd = "odd";
      var tot_time = 0;
      var tot_msgs = 0;
      for (var i = 0; i < result.length; i++)
      {
        var mon = result[i];
        tot_time += mon['cumulativeTime'];
        tot_msgs += mon['numEvents'];
        html_output += monitor_to_li(mon, odd);
        if (odd == "odd")
          odd = "even";
        else
          odd = "odd";        
      }
      $("#monitor-list").html(table_header() + html_output);
      show_fps_target(tot_time, tot_msgs);
      set_handlers();
    },
    error: handle_xhr_error
  });
}

function update_monitors()
{
  $("#status-light-inside").show().fadeOut(1500);
  $.ajax({
    url: proxy_prefix + '/monitor',
    type: 'GET',
    success: function(result)
    {
      var html_output = "";
      var tot_time = 0;
      var tot_msgs = 0;
      var odd = "odd";
      for (var i = 0; i < result.length; i++)
      {
        var mon = result[i];
        tot_time += mon['cumulativeTime'];
        tot_msgs += mon['numEvents'];
        update_monitor(mon);
      }
      show_fps_target(tot_time, tot_msgs);
    },
    error: handle_xhr_error
  });
}

function update_monitor(mon)
{
  var monid = mon['Caption'];
  var verdict = mon['verdict'];
  var verdict_class = 'inconclusive';
  var verdict_text = "Current status: cannot conclude yet";
  if (verdict == 'TRUE')
  {
    verdict_class = 'true';
    verdict_text = "Current status: property is true";
  }
  if (verdict == 'FALSE')
  {
    verdict_class = 'false';
    verdict_text = "Current status: property is false";
  }
  $("#mon-" + monid + "-verdict").removeClass("verdict-inconclusive");
  $("#mon-" + monid + "-verdict").addClass("verdict-" + verdict_class);
  $("#mon-" + monid + "-numevents").html(mon['numEvents']);
  $("#mon-" + monid + "-cumultime").html(display_time(mon['cumulativeTime']));
  if (mon['numEvents'] > 0)
    $("#mon-" + monid + "-avgtime").html(display_time(mon['cumulativeTime'] / mon['numEvents']));
}

function monitor_to_li(mon, odd)
{
  var html_output = "";
  var verdict = mon['verdict'];
  var monid = mon['Caption'];
  var verdict_class = 'inconclusive';
  var verdict_text = "Current status: cannot conclude yet";
  if (verdict == 'TRUE')
  {
    verdict_class = 'true';
    verdict_text = "Current status: property is true";
  }
  if (verdict == 'FALSE')
  {
    verdict_class = 'false';
    verdict_text = "Current status: property is false";
  }
  html_output += "<tr class=\"verdict-" + verdict_class + " " + odd + "\">";
  html_output += "<td id=\"mon-" + monid + "-verdict\" title=\"" + verdict_text + "\" class=\"verdict-" + verdict_class + "\"></td>";
  html_output += "<td class=\"monitor-contents\">";
  html_output += "<div title=\"Toggle details about monitor\" class=\"btn-expand-collapse\"></div>\n";
  html_output += "<div class=\"caption\">" + mon['Caption'] + "</div>";
  html_output += "<div class=\"monitor-details\">\n";
  if (mon['Description'])
  {
    html_output += "<div class=\"description\">" + mon['Description'] + "</div>";
  }
  html_output += "<div class=\"formula\">" + mon['formula'] + "</div>";
  html_output += "</div>\n";
  html_output += "</td>";
  html_output += "<td align=\"center\">";
  html_output += "<div id=\"mon-" + monid + "-numevents\" class=\"num-events\">" + mon['numEvents'] + "</div>";
  html_output += "</td>";
  html_output += "<td class=\"time-column\" id=\"mon-" + monid + "-cumultime\">" + display_time(mon['cumulativeTime']) + "</td>";
  html_output += "<td class=\"time-column\" id=\"mon-" + monid + "-avgtime\">";
  if (mon['numEvents'] > 0)
    html_output +=  display_time(mon['cumulativeTime'] / mon['numEvents']);
  else
    html_output += display_time(0);
  html_output += "</td>";
  html_output += "<td class=\"icon\" align=\"center\"><a href=\"#\" title=\"Reset monitor\" class=\"btn-reset-monitor\" onclick=\"reset_monitor('" + mon['Caption'] + "')\"><span class=\"text-only\">Reset</span></a></td>";
  html_output += "<td class=\"icon\" align=\"center\"><a href=\"#\" title=\"Delete monitor\" class=\"btn-delete-monitor\" onclick=\"delete_monitor('" + mon['Caption'] + "')\"><span class=\"text-only\">Delete</span></a></td>";
  html_output += "</tr>\n";
  return html_output;
}

poll_monitor = function()
{
  if (timer_started == true)
  {
    update_monitors();
    setTimeout(poll_monitor, timer_poll_interval);
  }
}

function display_time(t)
{
  if (t < 1000)
    return t + " ns";
  if (t < 1000000)
    return Math.round(t / 1000) + " &mu;s";
  if (t < 1000000000)
    return Math.round(t / 1000000) + " ms";
  return Math.round(t / 1000000000000) + " s";
}

function show_fps_target(time, msgs)
{
  var time_per = Math.round(msgs / time * 10000000000) / 10;
  if (time_per < 60)
    $("#fps-meter").css("color", "red");
  else
    $("#fps-meter").css("color", "darkgreen");
  $("#fps-meter").html(time_per + " Hz");
}

function table_header()
{
  html_output = "";
  html_output = "<tr><th style=\"border-top-left-radius:6px\"></th><th>Info</th><th>Events</th><th colspan=\"2\">Time (avg.)</th><th></th><th></th></tr>";
  return html_output;
}

function add_monitor()
{
  var html_old = "";
  html_old += "<tr id=\"new-monitor-tr\"><td colspan=\"7\"><p>Write the contents of the monitor to add in the box below</p>\n";
  html_old += getLtlfoToolbar();
  html_old += "<textarea id=\"new-monitor-contents\"></textarea><br />\n";
  html_old += "<div id=\"btn-cancel-new-monitor\">Cancel</div>\n";
  html_old += "<div id=\"btn-submit-new-monitor\">Submit</div>\n";
  html_old += "</td></tr>";
  $("#monitor-list").append(html_old);
  $("#btn-submit-new-monitor").button().click(process_add_monitor);
  $("#btn-cancel-new-monitor").button().click(cancel_add_monitor);
  $("#btn-add-monitor").css({"opacity" : 0.5}).off("click").css({"cursor": "default"});
  $("#btn-reset-monitors").css({"opacity" : 0.5}).off("click").css({"cursor": "default"});
  $(".toolbar-ltlfo").button();
}

function cancel_add_monitor()
{
  $("#new-monitor-tr").remove();
  $("#btn-add-monitor").css({"opacity" : 1}).click(add_monitor).css({"cursor": "pointer"});
  $("#btn-reset-monitors").css({"opacity" : 1}).click(reset_monitors).css({"cursor": "pointer"});
}

function process_add_monitor()
{
  $("#status-light-inside").show().fadeOut(1500);
  var mon_contents = $("#new-monitor-contents").val();
  if (!mon_contents.contains("@Caption("))
  {
    var seconds = new Date().getTime();
    mon_contents += "\n# @Caption(\"Monitor-" + seconds + "\");\n";
  }
  $.ajax({
    url: proxy_prefix + '/monitor',
    type: 'PUT',
    data: mon_contents,
    success: function(result)
    {
    },
    error: handle_xhr_error
  });
  $("#btn-add-monitor").css({"opacity" : 1}).click(add_monitor).css({"cursor": "pointer"});
  $("#btn-reset-monitors").css({"opacity" : 1}).click(reset_monitors).css({"cursor": "pointer"});
  refresh_monitors();
}

function insertAtCaret(areaId,text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
    	"ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") { 
    	txtarea.focus();
    	var range = document.selection.createRange();
    	range.moveStart ('character', -txtarea.value.length);
    	strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);  
    var back = (txtarea.value).substring(strPos,txtarea.value.length); 
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") { 
    	txtarea.focus();
    	var range = document.selection.createRange();
    	range.moveStart ('character', -txtarea.value.length);
    	range.moveStart ('character', strPos);
    	range.moveEnd ('character', 0);
    	range.select();
    }
    else if (br == "ff") {
    	txtarea.selectionStart = strPos;
    	txtarea.selectionEnd = strPos;
    	txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}

function getLtlfoToolbar()
{
  var html_out = "";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '∀ x ∈ /p : ()');\">∀</div>";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '∃ x ∈ /p : ()');\">∃</div>";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '∈');\">∈</div>";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '() ∧ ()');\">∧</div>";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '() ∨ ()');\">∨</div>";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '¬ ()');\">¬</div>";
  html_out += "<div class=\"toolbar-ltlfo\" onclick=\"insertAtCaret('new-monitor-contents', '() → ()');\">→</div>";
  return html_out;
}
