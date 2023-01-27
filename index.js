const express = require("express");
const app = express();
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(":memory:");

try {
  db.run(
    "CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE)"
  );
} catch (error) {
  console.log("ERROR during Running Table creation query", error);
}

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
    console.log(`Fetching Data From DB`);
    let sql = `SELECT url FROM links where url ='${link}'`;
    let data = new Promise((resolve, reject) => {
      db.all(sql, [], async (err, rows) => {
        if (err) {
          console.log("Error", err);
          reject(false);
        }
        resolve(rows.length);
      });
    });
    return await data;
  } catch (error) {
    console.log("error fetching data", error);
  }
};

const checkAndSend = async (url) => {
  try {
    if (await chekUrlExist(url)) {
      return true;
    }
    let message = "----------<b>TMV Updates</b>----------";
    message += " ";
    message += url;
    await sendTelegramMessage(message, true, true);
    insertData(url);
    return true;
  } catch (error) {
    console.log("unable to send message");
    return false;
  }
};

app.all("/", (req, res) => {
  res.send("Yo!");
});

app.get("/tmv", async (req, res) => {
  try {
    const url = await fetchUrl();
    let result = await axios.get(url);
    let data = result.data;
    const { document } = new JSDOM(data).window;
    let list = document.querySelector(
      "#ipsLayout_sidebar > div.cWidgetContainer > ul > li:nth-child(3) > div"
    ).childNodes[1].childNodes;
    let length = list.length - 1;
    let queryNumbers = [];
    for (let i = 1; i < length; i++) {
      if (i % 2 !== 0) queryNumbers.push(i);
    }

    for (let i = 0; i < queryNumbers.length; i++) {
      let index = queryNumbers[i];
      let url = list[index].childNodes[3].childNodes[3].childNodes[1].href;
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
