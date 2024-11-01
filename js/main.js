var arrayOfAllFeeds;

function websiteToRSS() {
  try {
    var url = document.getElementById("website").value;

    // Create URL object to parse the URL (throws error if invalid)
    const urlObject = new URL(url);
    addiFrame(url);
    checkIfRSSForWebsiteExists(url);
  } catch (error) {
    alert("Enter valid url");
    console.log(error);
  }
}

function checkIfRSSForWebsiteExists(url) {
  const corsURL = "https://cors-anywhere.herokuapp.com/" + url + "rss.xml";
  try {
    fetch(corsURL)
      .then((response) => response.text())
      .then((text) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/xml");
          const all_items = doc.getElementsByTagName("item");
          arrayOfAllFeeds = convertHTMLCollectionObjectToJSON(all_items);
          addTextToPreview(arrayOfAllFeeds);
        } catch (error) {
          alert("Something went wrong, try again!");
        }
      });
  } catch (error) {
    console.log("RSS doesn't exist for the website");
  }
}

function addiFrame(url) {
  if (document.getElementById("website-preview")) {
    document.getElementById("website-preview").remove();
  }
  const div = document.getElementById("left-section");

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
  div.insertAdjacentHTML(
    "beforeend",
    `<iframe
      id="website-preview"
      class="horizontal-section"
      src=${url}
      width="100%"
      title="Website Preview"
  />`,
  );
}

function addTextToPreview(arrayOfJSONObjects) {
  if (document.getElementById("feed-preview")) {
    document.getElementById("feed-preview").remove();
  }
  const div = document.getElementById("right-section");
  var newstring = "";

  for (let i = 0; i < 3; i++) {
    const cleanTitle = cleanString(arrayOfJSONObjects[i]["title"]);
    newstring += `<li>
    <div class="feed-item" onclick="showFeedContent(${cleanTitle})">
    ${arrayOfJSONObjects[i]["title"]}
    <div class="subtitle">${arrayOfJSONObjects[i]["date"]}</div>
    </div>
    <div id=${cleanTitle} class="display-box">${arrayOfJSONObjects[i]["content"]}</div>
    </li>`;
  }
  console.log("list being added", arrayOfJSONObjects);
  div.insertAdjacentHTML(
    "afterbegin",
    `<div id="feed-preview">
    <div class="horizontal-section">
            <div class="flex-row"><h2>Result </h2><button onClick="addToFeed()">Add to Feed</button></div>

            <h3>Example feed preview</h3>
        </div>
        <div class="horizontal-section">
            <ol>
                ${newstring}
            </ol>
        </div>
        </div>`,
  );
}
function convertHTMLCollectionObjectToJSON(htmlCollectionObject) {
  arrayOfJSONObjects = [];
  for (let i = 0; i < Math.min(htmlCollectionObject.length, 3); i++) {
    arrayOfJSONObjects.push({
      title: htmlCollectionObject[i].getElementsByTagName("title")[0].innerHTML,
      url: htmlCollectionObject[i].getElementsByTagName("link")[0].innerHTML,
      content:
        htmlCollectionObject[i].getElementsByTagName("description")[0]
          .innerHTML,
      date: htmlCollectionObject[i].getElementsByTagName("pubDate")[0]
        .innerHTML,
      author: "",
    });
  }
  return arrayOfJSONObjects;
}

function addToFeed() {
  fetch("http://localhost:8000/add_feed", {
    // Adding method type
    method: "POST",

    // Adding body or contents to send
    body: JSON.stringify({
      name: "foo",
      url: "bar",
      data: arrayOfAllFeeds,
    }),

    // Adding headers to the request
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    // Converting to JSON
    .then((response) => response.json())

    // Displaying results to console
    .then((json) => console.log(json));
  return arrayOfAllFeeds;
}

function cleanString(dirtyString) {
  return dirtyString.replace(/[|&;$%@"#<>()+ ,]/g, "");
}

function showFeedContent(cleanTitle) {
  const all_feeds = document.getElementsByClassName("display-box");
  // console.log("all_feeds", all_feeds);
  for (var i = 0; i < all_feeds.length; i++) {
    all_feeds[i].style.display = "none";
  }
  cleanTitle.style.display = "block";
}
