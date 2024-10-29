async function websiteToRSS() {
  try {
    var url = document.getElementById("website").value;

    // Create URL object to parse the URL (throws error if invalid)
    const urlObject = new URL(url);
    addiFrame(url);
    await checkIfRSSForWebsiteExists(url);
  } catch (error) {
    alert("Enter valid url");
    console.log(error);
  }
}

async function checkIfRSSForWebsiteExists(url) {
  try {
    fetch(`${url}rss.xml`, {
      mode: "cors",
      headers: {
        "Content-Type": "text/xml",
      },
    }).then((response) => console.log(response));
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
