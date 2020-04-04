// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

if (!chrome.cookies) {
    chrome.cookies = chrome.experimental.cookies;
}

// Shorthand for document.querySelector.
function select(selector) {
    return document.querySelector(selector);
}


function resetTable() {
    var table = select("#cookies");
    while (table.rows.length > 1) {
        table.deleteRow(table.rows.length - 1);
    }
}


function reloadCookieTable(domain) {
    resetTable();

    var table = select("#cookies");

    var cookies = cookiesForDomain
    var row = table.insertRow(-1);
    row.insertCell(-1).innerText = domain;
    var cell = row.insertCell(-1);
    cell.innerText = cookies.length;
    cell.setAttribute("class", "cookie_count");
}

function log(message, ...params) {
    // chrome.extension.getBackgroundPage().console.log(message, params)
    console.log(message, ...params)
}

var cookiesForDomain = [];

function onload() {
    getCurrentDomain(function (domain) {
        getCurrentUrl(url => {
            console.log('url', url);
            chrome.cookies.getAll({url: url}, function (cookies) {
                cookiesForDomain = cookies;
                reloadCookieTable(domain);
            })
        });
    })
}

function getCurrentDomain(callback) {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        //remove www
        const domain = new URL(tabs[0].url).host.replace('www', '');
        callback(domain)
    });
}

function getCurrentUrl(callback) {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        callback(tabs[0].url)
    });
}

function sendPost(url, payload) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
}

function httpGet(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(JSON.parse(xmlHttp.responseText));
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

const COOKIES_URL = 'http://192.168.10.240:8087/api/v1/cookies'

function sendCookies() {
    const cookies = cookiesForDomain;
    log("Sending cookies...", cookies)
    getCurrentDomain(domain => {
        sendPost(COOKIES_URL, {id: domain, cookies})
    });
    log(`Sent ${cookies.length} cookies`)
}

function receiveCookies() {
    getCurrentDomain(domain => {
        log("Receiving cookies...")
        httpGet(`${COOKIES_URL}?domain=${domain}`, function (res) {
            log(`Received cookies`, res)
            getCurrentUrl(function (url) {
                res.forEach(cookie => {
                    const newValue = {
                        url: url,
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.hostOnly ? undefined : cookie.domain,
                        path: cookie.path,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly,
                        sameSite: cookie.sameSite,
                        expirationDate: cookie.expirationDate,
                        storeId: cookie.storeId
                    }
                    console.log('setting cookie', newValue)
                    chrome.cookies.set(newValue, function (cookie) {
                        console.log('the cookie was set to ', cookie, chrome.runtime.lastError)
                    })
                })
            })
        });
    })
}

document.addEventListener('DOMContentLoaded', function () {
    onload();

    select("#send_cookies").addEventListener('click', sendCookies)
    select("#receive_cookies").addEventListener('click', receiveCookies)
});
