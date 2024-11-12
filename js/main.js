var arrayOfAllFeeds;
var isInEditMode = false;
var editID = null;
var title = "";
var link = "";
var manualSelection = {
  title: {},
  date: {},
  author: {},
  content: {},
};

// function to display iframe and check if rss exists
function websiteToRSS() {
  startLoader();
  var url = document.getElementById("website").value;
  try {
    const urlObject = new URL(url);
    console.log(urlObject, "urlObject");
    addiFrame(urlObject.href);
    checkIfRSSForWebsiteExists(urlObject.origin);
  } catch (error) {
    alert("Enter valid url");
    console.log(error);
  }
}

function checkIfRSSForWebsiteExists(url) {
  // Remove elements if not first call
  if (document.getElementById("feed-preview")) {
    document.getElementById("feed-preview").remove();
  }
  if (document.getElementById("feed-edit")) {
    document.getElementById("feed-edit").remove();
  }
  // API to get RSS feeds,if it exists, and send it as formate data
  fetch(
    "https://api.0x41head.com/detect_feeds?" +
      new URLSearchParams({ url: url }).toString(),
    {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    },
  )
    .then((response) => response.json())
    .then((feedDataJSON) => {
      title = feedDataJSON["title"];
      link = feedDataJSON["url"];
      displayFeedToPreview(feedDataJSON["data"]);
      closeLoader();
    });
}

function addiFrame(url) {
  document.getElementById("website-preview")
    ? document.getElementById("website-preview").remove()
    : null;
  const div = document.getElementById("left-section");

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
  div.insertAdjacentHTML(
    "beforeend",
    `<iframe
      is="x-frame-bypass"
      id="website-preview"
      class="horizontal-section"
      src=${url}
      width="100%"
      title="Website Preview"
      onload='setFrameLoaded();'
  />`,
  );
}

// check if we are in edit mode and if yes continue editing in iframe even if we change pages inside
function setFrameLoaded() {
  if (isInEditMode) startEditMode();
}

// add HTML of feed preview
function displayFeedToPreview(arrayOfJSONObjects) {
  const div = document.getElementById("right-section");
  var newstring = "";

  if (arrayOfJSONObjects) {
    for (let i = 0; i < Math.min(3, arrayOfJSONObjects.length); i++) {
      const cleanTitle = cleanString(arrayOfJSONObjects[i]["title"]);
      newstring += `
      <li>
        <div class="feed-item" onclick="showFeedContent(${cleanTitle})">
          ${arrayOfJSONObjects[i]["title"]}
        <div class="subtitle">${arrayOfJSONObjects[i]["date"]} - ${arrayOfJSONObjects[i]["url"]}</div>
        </div>
        <div id=${cleanTitle} class="display-box">${arrayOfJSONObjects[i]["content"]}</div>
      </li>`;
    }
  }
  console.log("list being added", arrayOfJSONObjects);
  arrayOfAllFeeds = arrayOfJSONObjects;
  div.insertAdjacentHTML(
    "afterbegin",
    `<div id="feed-preview">
      <div class="horizontal-section">
        <div class="flex-row">
          <h2>Result </h2>
          <div id="small-loader" style="display:none">
              <div class="small-loader"></div>
          </div>
          <button id="add-to-feed" onClick="addToFeed()"><i class="fa fa-plus"></i> Add to Feed</button>
        </div>
        <div class="flex-row">
          <h3>Example feed preview</h3>
          <button onClick="startEditMode()"><i class="fa fa-edit"></i> Edit</button>
        </div>
      </div>
      <div id="final-feeds" class="horizontal-section">
          <ol>
              ${newstring}
          </ol>
      </div>
    </div>`,
  );
}

// call API to add to database
function addToFeed() {
  const smallLoaderDiv = document.getElementById("small-loader");
  const addToFeedDiv = document.getElementById("add-to-feed");

  smallLoaderDiv.style.display = "block";
  addToFeedDiv.style.display = "none";
  fetch("http://localhost:8000/add_feed", {
    method: "POST",
    body: JSON.stringify({
      isEdited: isInEditMode,
      title: title,
      url: link,
      data: isInEditMode ? manualSelection : arrayOfAllFeeds,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((json) => {
      console.log(json);
      smallLoaderDiv.style.display = "none";
      addToFeedDiv.style.display = "block";
      alert("Feed Added!");
    });
  return arrayOfAllFeeds;
}

function cleanString(dirtyString) {
  return dirtyString.replace(/[^a-zA-Z0-9]/g, "");
}

function showFeedContent(cleanTitle) {
  const all_feeds = document.getElementsByClassName("display-box");
  for (var i = 0; i < all_feeds.length; i++) {
    all_feeds[i].style.display = "none";
  }
  cleanTitle.style.display = "block";
}

function startLoader() {
  document.getElementById("loader").style.display = "block";
}
function closeLoader() {
  document.getElementById("loader").style.display = "none";
}

function startEditMode() {
  isInEditMode = true;
  const feedPreviewDiv = document.getElementById("final-feeds");
  feedPreviewDiv.style.display = "none";
  displayEditFeedPanel();
  console.log(arrayOfAllFeeds, "arrayOfAllFeeds");
  setIframeForInspection();
}

function setIframeForInspection() {
  const iframeRoot =
    document.getElementById("website-preview").contentWindow.document;
  console.log("iframeRoot", iframeRoot);

  // Pointers on css: https://stackoverflow.com/questions/2700783/how-to-apply-childhover-but-not-parenthover
  var css = `*:hover:not(:has(*:hover)){ background-color: #9ACD32}`;
  var style = document.createElement("style");

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  iframeRoot.getElementsByTagName("head")[0].appendChild(style);
  iframeRoot.querySelectorAll("body *").forEach((element) => {
    element.addEventListener("click", (event) => {
      const tagID = event.currentTarget.innerHTML;
      console.log(event.currentTarget, "event.currentTarget");
      setClassListInManualSelection(
        editID,
        event.currentTarget.classList,
        event.currentTarget.localName,
      );
      if (event.currentTarget == event.target) {
        replaceText(editID, tagID);
        console.log("classListForElementKey", manualSelection);
      }
    });
  });
}

function displayEditFeedPanel() {
  if (!document.getElementById("feed-edit")) {
    const div = document.getElementById("right-section");

    div.insertAdjacentHTML(
      "beforeend",
      `
      <div id="feed-edit" class="edit-section">
        <div class="horizontal-section-edit">
          <div class="flex-row">Title:<input id="title" value="${arrayOfAllFeeds[0].title}" class="single-row-edit" onclick="setEditID('title')"/></div>
          <div class="flex-row">Date:<input id="date" value="${arrayOfAllFeeds[0].date}" class="single-row-edit" onclick="setEditID('date')"/></div>
          <div class="flex-row">Link:<input id="link" value="${arrayOfAllFeeds[0].url}" class="single-row-edit" onclick="setEditID('link')"/></div>
          <div class="flex-row">Author:<input id="author" value="${arrayOfAllFeeds[0].author}" class="single-row-edit" onclick="setEditID('author')"/></div>
          <div class="flex-row">Content:<div id="content" class="display-box-edit" onclick="setEditID('content')">${arrayOfAllFeeds[0].content}</div></div>
        </div>
      </div>`,
    );
  }
}
function setEditID(id) {
  editID = id;
  manualSelection[id] = {};
  console.log(editID, "editID");
}
function replaceText(id, replacementText) {
  if (id) {
    const div = document.getElementById(id);
    if (id == "content") {
      div.innerHTML = replacementText;
      document
        .getElementById("link")
        .setAttribute(
          "value",
          document.getElementById("website-preview").contentDocument.baseURI,
        );
      console.log(document.getElementById("website-preview"), "lolo");
    } else div.setAttribute("value", replacementText);
  }
}

function setClassListInManualSelection(id, classList, elementName) {
  if (classList.length == 0 || manualSelection[id]?.classList?.length) return;

  manualSelection[id]["classList"] = Array.from(classList);
  manualSelection[id]["element"] = elementName;
  manualSelection[id]["url"] =
    document.getElementById("website-preview").contentDocument.baseURI;
}
