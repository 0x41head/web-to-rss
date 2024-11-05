var arrayOfAllFeeds;
var isInEditMode = false;
var editID = null;
var title = "";
var url = "";

function websiteToRSS() {
  startLoader();
  var url = document.getElementById("website").value;
  try {
    // Create URL object to parse the URL (throws error if invalid)
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
  if (document.getElementById("feed-preview")) {
    document.getElementById("feed-preview").remove();
  }
  if (document.getElementById("feed-edit")) {
    document.getElementById("feed-edit").remove();
  }
  fetch(
    "http://localhost:8000/detect_feeds?" +
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
      url = feedDataJSON["url"];
      displayFeedToPreview(feedDataJSON["data"]);
      closeLoader();
    });
}

function addiFrame(url) {
  document.getElementById("website-preview")
    ? document.getElementById("website-preview").remove()
    : null;
  const div = document.getElementById("left-section");

  // // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
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

function setFrameLoaded() {
  if (isInEditMode) startEditMode();
}

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
          <button onClick="addToFeed()">Add to Feed</button>
        </div>
        <div class="flex-row">
          <h3>Example feed preview</h3>
          <button onClick="startEditMode()">Edit</button>
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

function addToFeed() {
  fetch("http://localhost:8000/add_feed", {
    method: "POST",
    body: JSON.stringify({
      title: title,
      url: url,
      data: arrayOfAllFeeds,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((json) => console.log(json));
  return arrayOfAllFeeds;
}

function cleanString(dirtyString) {
  return dirtyString.replace(/[|&;$%@"#<>`''()+ ,]/g, "");
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

  var css = `*:hover:not(:has(*:hover)){ background-color: #00ff00}`;
  var style = document.createElement("style");

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  iframeRoot.getElementsByTagName("head")[0].appendChild(style);
  iframeRoot.querySelectorAll("body *").forEach((element) => {
    element.addEventListener("click", (event) => {
      const imageId = event.currentTarget.innerHTML;
      if (event.currentTarget == event.target) {
        replaceText(editID, imageId);
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
          <div class="flex-row">Title:<input id="editable-title" value="${arrayOfAllFeeds[0].title}" class="single-row-edit" onclick="setEditID('editable-title')"/></div>
          <div class="flex-row">Date:<input id="editable-date" value="${arrayOfAllFeeds[0].date}" class="single-row-edit" onclick="setEditID('editable-date')"/></div>
          <div class="flex-row">Link:<input id="editable-link" value="${arrayOfAllFeeds[0].url}" class="single-row-edit" onclick="setEditID('editable-link')"/></div>
          <div class="flex-row">Author:<input id="editable-author" value="${arrayOfAllFeeds[0].author}" class="single-row-edit" onclick="setEditID('editable-author')"/></div>
          <div class="flex-row">Content:<div id="editable-content" class="display-box-edit" onclick="setEditID('editable-content')">${arrayOfAllFeeds[0].content}</div></div>
        </div>
      </div>`,
    );
  }
}
function setEditID(id) {
  editID = id;
  console.log(editID, "editID");
}
function replaceText(id, replacementText) {
  if (id) {
    const div = document.getElementById(id);
    if (id == "editable-content") {
      div.innerHTML = replacementText;
      document
        .getElementById("editable-link")
        .setAttribute(
          "value",
          document.getElementById("website-preview").contentDocument.baseURI,
        );
      console.log(document.getElementById("website-preview"), "lolo");
    } else div.setAttribute("value", replacementText);
  }
}
