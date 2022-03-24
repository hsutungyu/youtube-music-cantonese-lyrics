function saveOptions(e) {
  e.preventDefault();
  function setAPIKey(data) {
    var currentDate = new Date();
    var APIExpireDate = currentDate.setSeconds(
      currentDate.getSeconds() + data.expires_in
    );
    browser.storage.sync.set({
      kkboxapikey: data.access_token,
      kkboxapikeyexpiredate: APIExpireDate,
      kkboxid: encodeURIComponent(document.querySelector("#kkboxid").value),
      kkboxsecret: encodeURIComponent(
        document.querySelector("#kkboxsecret").value
      ),
    });
    document.querySelector("#saveconfirm").textContent = "Save好啦！";
  }
  function getAPIKey(result) {
    // check if id and secret are empty
    if (
      document.querySelector("#kkboxid").value == "" ||
      document.querySelector("#kkboxsecret").value == ""
    ) {
      document.querySelector("#saveconfirm").textContent =
        "請輸入ID同埋Secret！";
    } else if (
      result.kkboxapikey == "" ||
      document.querySelector("#kkboxid").value != result.kkboxid ||
      document.querySelector("#kkboxsecret").value != result.kkboxsecret
    ) {
      // if kkboxapikey is not yet set, or if id and secret has changed
      var requestData = {
        grant_type: "client_credentials",
        client_id: encodeURIComponent(document.querySelector("#kkboxid").value),
        client_secret: encodeURIComponent(
          document.querySelector("#kkboxsecret").value
        ),
      };
      var requestURL = "https://account.kkbox.com/oauth2/token";
      $.ajax({
        type: "POST",
        contentType: "application/x-www-form-urlencoded",
        url: requestURL,
        data: requestData,
        success: function (data) {
          setAPIKey(data);
        },
        error: function (xhr) {
          alert(JSON.stringify(xhr));
        },
      });
    }
  }
  let gettingAPIKey = browser.storage.sync.get();
  gettingAPIKey.then(getAPIKey);
}

function restoreOptions() {
  function setCurrentAPIKey(result) {
    document.querySelector("#kkboxid").value = result.kkboxid || "";
    document.querySelector("#kkboxsecret").value = result.kkboxsecret || "";
  }
  function onError(error) {
    console.log(`error: ${error}`);
  }
  let gettingAPIKey = browser.storage.sync.get();
  gettingAPIKey.then(setCurrentAPIKey, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
