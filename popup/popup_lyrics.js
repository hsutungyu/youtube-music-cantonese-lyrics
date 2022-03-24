document.addEventListener("DOMContentLoaded", getExpireDate);
const refreshButton = document.getElementById("lyrics-refresh");
refreshButton.addEventListener("click", checkDomain);

function onError(error) {
  console.log(`error: ${error}`);
}

function getActiveTab() {
  return browser.tabs.query({ currentWindow: true, active: true });
}

function parseHTMLString(data) {
  const parser = new DOMParser();
  const temp = parser.parseFromString(data, "text/html");
  document.getElementById("lyrics-body").innerText =
    temp.getElementsByClassName("lyrics")[0].innerText;
}

function scrapeKKBOX(songURL) {
  $.ajax({
    url: songURL,
    type: "GET",
    success: function (data) {
      // document.getElementById("lyrics-body").innerHTML = data;
      parseHTMLString(data);
    },
    error: function (xhr, status, error) {
      document.getElementById("lyrics-body").textContent = JSON.stringify(xhr);
    },
  });
}

function parseForLyrics(data) {
  var songURL = data.tracks.data[0].url;
  // document.getElementById("lyrics-body").innerHTML = songURL;
  document.getElementById("lyrics-kkbox").href = songURL;
  scrapeKKBOX(songURL);
}

function checkKKBOX(currentSongName) {
  let kkboxapikey = browser.storage.sync.get("kkboxapikey");
  kkboxapikey.then((key) => {
    // call KKBOX API to retrieve the first result
    var currentSongNameEncoded = encodeURIComponent(currentSongName);
    var requestURL = `https://api.kkbox.com/v1.1/search?q=${currentSongNameEncoded}&type=track&territory=HK&limit=1`;
    var requestHeaders = {
      accept: "application/json",
      authorization: `Bearer ${key["kkboxapikey"]}`,
    };
    document.getElementById("lyrics-body").textContent = "幫緊你幫緊你。。。";
    $.ajax({
      type: "GET",
      url: requestURL,
      headers: requestHeaders,
      success: function (data) {
        parseForLyrics(data);
      },
      error: function (xhr, status, error) {
        document.getElementById("lyrics-body").textContent = `衰左: ${error}`;
      },
    });
  });
}

function checkDomain() {
  /**
   * If the active tab is not YouTube Music, i.e., if the domain name is not music.youtube.com, then raise error on the popup
   * else, change the content of the popup to the lyrics found in KKBOX
   */
  // tabs.query would return an array with only 1 element
  getActiveTab().then((tab) => {
    var currentURL = tab[0].url;
    // https://stackoverflow.com/a/54947757
    const getHostName = (url) => {
      return new URL(url).hostname;
    };
    var currentHostname = getHostName(currentURL);
    if (currentHostname !== "music.youtube.com") {
      // not on YouTube Music, raise error
      document.querySelector("#error-content").classList.remove("hidden");
      document.querySelector("#popup-content").classList.add("hidden");
      document.getElementById("error-message").textContent =
        "撳入YouTube Music到再用！";
    } else {
      // on YouTube Music, find the title of the active tab for the song name
      var currentTitle = tab[0].title;
      // "YouTube Music" --> no song is being played
      if (currentTitle == "YouTube Music") {
        document.querySelector("#error-content").classList.remove("hidden");
        document.querySelector("#popup-content").classList.add("hidden");
        document.getElementById("error-message").textContent = "你冇播緊歌！";
      } else {
        // "{songname} - YouTube Music"
        var currentSongName = currentTitle.substring(
          0,
          currentTitle.length - 16
        );
        checkKKBOX(currentSongName);
        //document.getElementById("lyrics-body").innerHTML = currentSongName;
      }
    }
  });
}

// if the current date is larger than the expire date, update the API key
function updateAPIKey(result) {
  function setNewAPIKey(data) {
    var currentDate = new Date();
    var APIExpireDate = currentDate.setSeconds(
      currentDate.getSeconds() + data.expires_in
    );
    browser.storage.sync.set({
      kkboxapikey: data.access_token,
      kkboxapikeyexpiredate: APIExpireDate,
    });
    checkDomain();
  }
  var currentDate = new Date();
  if (result.kkboxapikeyexpiredate > currentDate.getTime()) {
    var requestData = {
      grant_type: "client_credentials",
      client_id: result.kkboxid,
      client_secret: result.kkboxsecret,
    };
    var requestURL = "https://account.kkbox.com/oauth2/token";
    $.ajax({
      type: "POST",
      contentType: "application/x-www-form-urlencoded",
      url: requestURL,
      data: requestData,
      success: function (data) {
        setNewAPIKey(data);
      },
      error: function (xhr) {
        alert(JSON.stringify(xhr));
      },
    });
  } else {
    checkDomain();
  }
}

function getExpireDate() {
  let kkboxapikeyexpiredate = browser.storage.sync.get();
  kkboxapikeyexpiredate.then(updateAPIKey);
}
