const express = require("express");
const app = express();

const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("links.db");
db.run(
  "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE)"
);

//Functions

const sendTelegramMessage = async (message, html, links) => {
  const username = "@jayanthm";
  const telegramUrl = "https://api.callmebot.com/text.php";
  try {
    let URL = `${telegramUrl}?user=${username}&text=${message}`;
    if (html) {
      URL += "&html=yes";
    }
    if (links) {
      URL += "&links=yes";
    }
    return await axios.get(URL);
  } catch (error) {
    console.log("unable to send message");
  }
};

const fetchUrl = async () => {
  const URL = "https://api.npoint.io/e7cfcfb7fd88fa0d7d0e";
  let res = await axios.get(URL);
  console.log(res.data.url);
  return res.data.url;
};

const insertData = (link) => {
  try {
    let query = `INSERT OR IGNORE INTO links (url) values('${link}')`;
    db.run(query);
    return true;
  } catch (error) {
    console.log(error);
    console.log("error during adding data");
  }
};

const chekUrlExist = async (link) => {
  try {
    let sql = `SELECT url FROM links where url ='${link}'`;
    let data = new Promise((resolve, reject) => {
      db.all(sql, [], async (err, rows) => {
        if (err) {
          reject(false);
        }
        resolve(rows.length);
      });
    });
    return await data;
  } catch (error) {
    console.log("error fetching data");
  }
};

const checkAndSend = async (url) => {
  try {
    if (await chekUrlExist(url)) {
      return;
    }
    let message = "----------<b>TMV Updates</b>----------";
    message += " ";
    message += url;
    await sendTelegramMessage(message, true, true);
    await insertData(url);
    return true;
  } catch (error) {
    console.log("unable to send message");
    return false;
  }
};

app.all("/", (req, res) => {
  console.log("Just got a request!");
  res.send("Yo!");
});

app.get("/tmv", async (req, res) => {
  try {
    const url = await fetchUrl();
    let result = await axios.get(url);
    let data = result.data;
    const { document } = new JSDOM(data).window;
    let queryNumbers = [1, 3, 5, 7, 9];
    for (let i = 0; i < queryNumbers.length; i++) {
      let index = queryNumbers[i];
      let url =
        document.querySelector(".ipsDataList").childNodes[index].childNodes[3]
          .childNodes[3].childNodes[1].href;
      await checkAndSend(url);
    }
    res.send("OK");
  } catch (error) {
    let errorMessage = `----------<b>TMV Updates</b>----------
    <code>Unable to load, please update the URL</code>`;
    await sendTelegramMessage(errorMessage, true, false);
    res.send("Unable to Load the url");
  }
});
app.listen(process.env.PORT || 3000);
