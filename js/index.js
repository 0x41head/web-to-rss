getAllFeeds();
function getAllFeeds() {
  fetch("http://localhost:8000/get_all_feeds")
    .then((response) => response.json())
    .then((arrayOfFeedObjects) => {
      addFeedTitles(arrayOfFeedObjects);
    });
}

function addFeedTitles(arrayOfFeedObjects) {
  const left_div = document.getElementById("feed-author");

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML

  arrayOfFeedObjects.map((feed_author) => {
    left_div.insertAdjacentHTML(
      "beforeend",
      `<div
        id="website-preview"
        class="feed-item"
        width="100%">
        ${feed_author.name}
        </div>`,
    );
    const allFeeds = feed_author.data;
    const mid_div = document.getElementById("feed-titles");
    console.log(mid_div);
    mid_div.focus();
    allFeeds.map((feed) => {
      createFeedContent(feed);
      const cleanStr = cleanString(feed.title);
      console.log(cleanStr, "cleanStr");
      mid_div.insertAdjacentHTML(
        "beforeend",
        `<h4
        class="feed-item"
        onClick="showFeedContent(${cleanStr})">
          ${feed.title}
        </h4>`,
      );
    });
  });
}

function createFeedContent(feed) {
  const right_div = document.getElementById("feed-content");
  const cleanStr = cleanString(feed.title);

  right_div.insertAdjacentHTML(
    "beforeend",
    `<span id="${cleanStr}" class="xxx" style="display:none">
    ${feed.content}
    </span>`,
  );
}
function showFeedContent(cleanTitle) {
  const all_feeds = document.getElementsByTagName("span");
  // console.log("all_feeds", all_feeds);
  for (var i = 0; i < all_feeds.length; i++) {
    all_feeds[i].style.display = "none";
  }
  cleanTitle.style.display = "block";
}

function cleanString(dirtyString) {
  return dirtyString.replace(/[|&;$%@"#<>()+ ,]/g, "");
}
