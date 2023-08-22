// 開始時に実行する
// 日記の全件取得
window.onload = async () => {
  const response = await fetch("/get_diary");
  const json = await response?.json();
  if (json && json["diary"] !== undefined) {
    for (const diary of json["diary"]) {
      document.getElementById("diary-list").innerHTML += await
      `<tr class="id" id="id"><td id="date">${diary[date]}</td><td class="weather" id="weather"><img class="img" src="${diary[weather]}.png" alt="weather"/></td><td class="text" id="text">${diary[text]}</td></tr>`
    }
  }
}

// 日記の追加
document.getElementById("diary-button").onclick = async() => {

  const text = document.getElementById("text-input").value;
  const date = document.getElementById("date-input").value;
  const weather = document.getElementById("weather-input").value;
  const response = await fetch("/insert-diary",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      date: date,
      weather: weather,
      text: text,
    })
  });
  document.getElementById("diary-list").innerHTML = await `<tr class="id" id="id"><td id="date">${diary[date]}</td><td class="weather" id="weather"><img class="img" src="${diary[weather]}.png" alt="weather"/></td><td class="text" id="text">${diary[text]}</td></tr>`;
};

// 日記の自動生成
document.getElementById("gpt-button").onclick = async () => {
  const words = document.getElementById("gpt-input").value;
  const response = await fetch("/gpt",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      words: words
    })
  });
  document.getElementById("text-input").innerText = await response.text();
}
