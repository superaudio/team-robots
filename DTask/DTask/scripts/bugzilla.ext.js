// Generated by CoffeeScript 1.10.0
(function() {
  var addLinkingGif, bugzDefaultLinksUrl, bugzId, bugzTitle, bugzillaId, createTodolist, createTowerAction, createTowerUrl, dtaskUrl, getDTaskUrl, getProductBack, getProductUrl, getTodolistGuid, handleAjaxError, initBugzProductDefaultLinks, initCurrentBugzInfo, initUrls, linkDiv, linksHandle, linksUrl, loginToTower, params, port, product, sendCreateTowerTodoRequest, todolistName, towerToken;

  port = chrome.runtime.connect({
    name: "dataconnect"
  });

  dtaskUrl = "";

  linksUrl = "";

  bugzDefaultLinksUrl = "";

  createTowerUrl = "";

  getProductUrl = "";

  todolistName = "从Bugzilla创建的bug";

  params = $.parseParams(location.search.substr(1));

  bugzId = params["id"];

  bugzTitle = $("#short_desc_nonedit_display").html();

  product = "";

  params = $.parseParams(location.search.substr(1));

  bugzillaId = params["id"];

  towerToken = $.cookie('Tower-Token');

  port.onMessage.addListener(function(msg) {
    switch (msg.type) {
      case "bugz_open_tower_login_tab_result":
        return console.log("open tower login tab");
      case "query_dtask_url_result":
        dtaskUrl = msg.url;
        initUrls();
        return initCurrentBugzInfo();
    }
  });

  getDTaskUrl = function() {
    return port.postMessage({
      type: "query_dtask_url"
    });
  };

  loginToTower = function() {
    return port.postMessage({
      type: "bugz_open_tower_login_tab"
    });
  };

  addLinkingGif = function() {
    var gif;
    gif = $(document.createElement("img"));
    gif.attr({
      src: chrome.extension.getURL("images/loading.gif")
    });
    gif.css({
      height: "20px",
      width: "20px"
    });
    linkDiv.html("");
    return linkDiv.append(gif);
  };

  createTowerAction = function() {
    if (!towerToken) {
      return loginToTower();
    } else {
      addLinkingGif();
      return $.ajax({
        url: bugzDefaultLinksUrl,
        dataType: "json",
        success: initBugzProductDefaultLinks
      });
    }
  };

  createTodolist = function(projectGuid) {
    return $.ajax({
      url: dtaskUrl + "/services/tower/projects/" + projectGuid + "/todolists",
      type: "POST",
      dataType: "json",
      headers: {
        "Tower-Token": towerToken
      },
      data: {
        "title": todolistName
      },
      success: function(data) {
        var todolistGuid;
        if (!data.error) {
          console.log("create todolist successfully");
          console.log(data);
          todolistGuid = data.result.guid;
          return sendCreateTowerTodoRequest(todolistGuid);
        } else {
          console.log("create tower failed");
          console.log(data.error_message);
          return alert("创建清单失败 " + data.error_message);
        }
      }
    });
  };

  sendCreateTowerTodoRequest = function(guid) {
    console.log("creating tower ...");
    return $.ajax({
      url: dtaskUrl + "/services/tower/import/bugzilla_bug",
      type: "PUT",
      dataType: "json",
      headers: {
        "Tower-Token": towerToken
      },
      data: {
        "bug_id": bugzId,
        "todolist_guid": guid,
        "bug_titile": bugzTitle
      },
      success: function(data) {
        if (!data.error) {
          console.log("create tower successfully");
          console.log(data);
          return location.reload();
        } else {
          console.log("create tower failed");
          console.log(data.error_message);
          return alert("创建失败 " + data.error_message);
        }
      }
    });
  };

  linksHandle = function(data) {
    var link, tower_todo;
    linkDiv.html("");
    if (data.result === null || data.result.length === 0) {
      link = $(document.createElement("a"));
      link.attr({
        "id": "createTaskBtn",
        "href": "javascript:void(0)"
      });
      link.click(createTowerAction);
      link.text("创建讨论");
    } else {
      tower_todo = data.result[0];
      bugzDefaultLinks = data.links;
      projectGuid = bugzDefaultLinks[product];
      link = $(document.createElement("a"));
      link.attr({
        "href": "https://tower.im/projects/" + projectGuid + "/todos/" + tower_todo,
        "target": "_blank"
      });
      link.text("查看tower");
    }
    return linkDiv.append(link);
  };

  getProductBack = function(data) {
    return product = data.result.product;
  };

  linkDiv = $(document.createElement("div"));

  $("#summary_alias_container").after(linkDiv);

  $("#summary_alias_container").css("display", "inline");

  linkDiv.css({
    display: "inline",
    "margin-left": "20px"
  });

  initBugzProductDefaultLinks = function(data) {
    var bugzDefaultLinks, projectGuid, titile, url;
    if (!data.error) {
      bugzDefaultLinks = data.links;
      projectGuid = bugzDefaultLinks[product];
      if (projectGuid) {
        return getTodolistGuid(projectGuid);
      } else {
        titile = $("#short_desc_nonedit_display").html();
        url = createTowerUrl + "?id=" + bugzillaId + "&title=" + titile + "&tt=" + ($.cookie('Tower-Token'));
        return window.location = url;
      }
    } else {
      return alert("获取默认项目失败：" + data.err_msg);
    }
  };

  getTodolistGuid = function(projectGuid) {
    return $.ajax({
      url: dtaskUrl + "/services/tower/projects/" + projectGuid + "/todolists",
      dataType: "json",
      headers: {
        "Tower-Token": towerToken
      },
      success: function(data) {
        var i, item, len, ref, todolistGuid;
        if (!data.error) {
          todolistGuid = "";
          ref = data.result;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            if (item.name === todolistName) {
              todolistGuid = item.guid;
            }
          }
          if (todolistGuid === "") {
            return createTodolist(projectGuid);
          } else {
            return sendCreateTowerTodoRequest(todolistGuid);
          }
        }
      }
    });
  };

  initUrls = function() {
    linksUrl = dtaskUrl + "/links";
    bugzDefaultLinksUrl = dtaskUrl + "/plugin/services/bugz_default_links";
    createTowerUrl = dtaskUrl + "/plugin/static/create_tower.html";
    return getProductUrl = dtaskUrl + "/services/bugzilla/bug";
  };

  handleAjaxError = function(request, msg, e) {
    return alert(msg);
  };

  initCurrentBugzInfo = function() {
    $.ajax({
      url: linksUrl,
      dataType: "json",
      data: {
        "bugzilla": bugzillaId,
        "tower_todo": "-"
      },
      success: linksHandle
    });
    return $.ajax({
      url: getProductUrl + "/" + bugzillaId,
      dataType: "json",
      success: getProductBack,
      error: handleAjaxError
    });
  };

  getDTaskUrl();

}).call(this);
