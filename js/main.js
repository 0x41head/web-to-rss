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
  try {
    fetch(`https://cors-anywhere.herokuapp.com/${url}rss.xml`)
      .then((response) => response.text())
      .then((text) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/xml");
          const all_items = doc.getElementsByTagName("item");
          addTextToPreview(convertHTMLCollectionObjectToJSON(all_items));
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
  const div = document.getElementById("right-section");

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
    newstring += `<li>${arrayOfJSONObjects[i]["title"]}
    <span class="arrow"></span>
    <div class="subtitle">${arrayOfJSONObjects[i]["date"]}</div>
    <a class="subtitle" href="${arrayOfJSONObjects[i]["url"]}">${arrayOfJSONObjects[i]["url"]}</a>
    <div>${arrayOfJSONObjects[i]["content"]}</div>
    </li>`;
  }
  console.log("list being added", arrayOfJSONObjects);
  div.insertAdjacentHTML(
    "afterbegin",
    `<div id="feed-preview">
    <div class="horizontal-section">
            <div class="flex-row"><h2>Result </h2><button>Add to Feed</button></div>

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
