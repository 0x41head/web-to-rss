getAllFeeds();

// Delete feed API call
function deleteFeed(title) {
  console.log("delete");
  fetch("https://api.0x41head.com/delete_feed", {
    method: "POST",
    body: JSON.stringify({
      title: title,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => console.log(response.json()))
    .then((arrayOfFeedObjects) => {
      location.reload();
    });
}

//get all feeds API call
function getAllFeeds() {
  fetch("https://api.0x41head.com/get_all_feeds")
    .then((response) => response.json())
    .then((arrayOfFeedObjects) => {
      startLoader();
      addFeedTitles(arrayOfFeedObjects);
      closeLoader();
    });
}

// function to generate feed titles and website titles (mid and left div)
function addFeedTitles(arrayOfFeedObjects) {
  const left_div = document.getElementById("feed-author");

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
  allFeeds = [];
  left_div.insertAdjacentHTML(
    "beforeend",
    `<div
      class="feed-title all-feeds"
      width="100%"
      onclick=selectFeeds("all_feeds")>
      All feeds
      </div>`,
  );
  arrayOfFeedObjects.map((feed_author) => {
    left_div.insertAdjacentHTML(
      "beforeend",
      `<div
        class="feed-title"
        >
        <div class="feed-title-text" onclick=selectFeeds("${cleanString(feed_author.title)}")>${feed_author.title}</div>
        <button class="delete-button" onClick=deleteFeed("${feed_author.title}")> <i class="fa fa-trash"></i></button>
        </div>`,
    );
    allFeeds = allFeeds.concat(feed_author.data);
  });

  // function to sort with timestamp in desc order
  allFeeds.sort(function (a, b) {
    var timestamp1 = new Date(a.timestamp),
      timestamp2 = new Date(b.timestamp);
    // Compare the 2 dates
    if (timestamp1 < timestamp2) return 1;
    if (timestamp1 > timestamp2) return -1;
    return 0;
  });
  const mid_div = document.getElementById("feed-titles");
  console.log(allFeeds, "allFeeds");
  mid_div.focus();
  allFeeds.map((feed) => {
    createFeedContent(feed);
    const cleanStr = cleanString(feed.title);
    console.log(cleanStr, "cleanStr");
    mid_div.insertAdjacentHTML(
      "beforeend",
      `<div
      class="feed-item ${cleanString(feed.feedName)}"
      onClick="showFeedContent(${cleanStr})">
        <h4>${feed.title}</h4>
      </div>`,
    );
  });
}

// function to generate and hide all feed content
function createFeedContent(feed) {
  console.log("feed", feed);
  const right_div = document.getElementById("feed-content");
  const cleanStr = cleanString(feed.title);

  right_div.insertAdjacentHTML(
    "beforeend",
    `<span id="${cleanStr}" style="display:none">
    <h2>${feed.author}</h2>
    <a href=${feed.url} target="_blank">${feed.url}</a><br/>
    <i>${feed.date}</i><br/>
    ${feed.content}
    </span>`,
  );
}

//Function to hide and display actual feed content
function showFeedContent(cleanTitle) {
  const all_feeds = document.getElementsByTagName("span");
  // console.log("all_feeds", all_feeds);
  for (var i = 0; i < all_feeds.length; i++) {
    all_feeds[i].style.display = "none";
  }
  cleanTitle.style.display = "block";
}

// function to show and hide feed titles
function selectFeeds(feedClass) {
  console.log(feedClass);

  if (feedClass === "all_feeds") {
    console.log(feedClass);
    Array.from(document.querySelectorAll(`div.feed-item`)).forEach(
      (element) => (element.style.display = "block"),
    );
    return;
  }
  Array.from(
    document.querySelectorAll(`div.feed-item:not(.${feedClass})`),
  ).forEach((element) => (element.style.display = "none"));
  Array.from(document.querySelectorAll(`div.feed-item.${feedClass}`)).forEach(
    (element) => (element.style.display = "block"),
  );
}

// utility functions
function cleanString(dirtyString) {
  return dirtyString.replace(/[^a-zA-Z0-9]/g, "");
}

function startLoader() {
  document.getElementById("loader").style.display = "block";
}
function closeLoader() {
  document.getElementById("loader").style.display = "none";
}
