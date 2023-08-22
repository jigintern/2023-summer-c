// 開始時に実行する
// 日記の全件取得
window.onload = async () => {
  const response = await fetch("/get-diary");
  let json = await response?.json();
  for (let i=0; i<Object.keys(json).length;i++) {
    document.getElementById("diary-list").innerHTML += await
    `<tr class="id" id="${json[i]["id"]}"><td id="date">${json[i]["date"].slice(0, 10)}</td><td class="weather" id="weather"><figure class="image is-24x24"><img class="img" src="img/${json[i]["weather"]}.png" alt="weather"/></figure></td><td class="text" id="text">${json[i]["text"]}</td></tr>`
  }
}

// 日記の追加
document.getElementById("diary-button").onclick = async() => {
  const text = document.getElementById("text-input").value;
  const date = document.getElementById("date-input").value;
  let weather = document.getElementById("weather-input").value;

  // 天気の自動入力
  if(weather === "") {
    const response = await fetch("/get-weather?date=" + date)
    if (response.text() === -1) {
      window.alert("未来の日記です。天気を入力してください。");
      return;
    }
    weather = await response.text();
  }
  const response = await fetch("/insert-diary",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      date: date,
      weather: weather,
      text: text,
    })
  });
  location.reload();
};

// 日記の自動生成
document.getElementById("gpt-button").onclick = async (e) => {
  e.preventDefault();
  const words = document.getElementById("gpt-input").value;
  const response = await fetch("/generate-gpt",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      words: words
    })
  });
  document.getElementById("text-input").innerText = await response.text();
}
