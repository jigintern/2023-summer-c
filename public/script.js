// 開始時に実行する
// 日記の全件取得
window.onload = async () => {
  const response = await fetch("/get-diary");
  let json = await response?.json();
  const diaryList = document.getElementById("diary-list");

  for (let i = 0; i < Object.keys(json).length; i++) {
    const id = json[i]["id"];

    // 行を生成
    const row = document.createElement("tr");
    row.classList.add("id");
    row.id = id;

    // 削除ボタンを生成
    const deleteButton = document.createElement("button");
    deleteButton.id = "delete-button-" + id;
    deleteButton.classList.add("delete");
    deleteButton.onclick = handleDeleteButtonClick;

    //削除ボタン列を生成
    const deleteButtonColumn = document.createElement("td");
    deleteButtonColumn.id = id;
    deleteButtonColumn.appendChild(deleteButton);

    // 日付列を生成
    const dateColumn = document.createElement("td");
    dateColumn.classList.add("date", "single-line")
    dateColumn.textContent = json[i]["date"].slice(5, 10);

    // 天気列を生成
    const weatherColumn = document.createElement("td");
    weatherColumn.classList.add("weather")
    const weatherFigure = document.createElement("figure");
    weatherFigure.classList.add("image", "is-24x24");
    const weatherImage = document.createElement("img");
    weatherImage.classList.add("img");
    weatherImage.src = "img/" + json[i]["weather"] + ".png";
    weatherImage.alt = "weather";
    weatherFigure.appendChild(weatherImage);
    weatherColumn.appendChild(weatherFigure);

    // テキスト列を生成
    const textColumn = document.createElement("td");
    textColumn.classList.add("text")
    textColumn.id = "text"
    textColumn.textContent = json[i]["text"];

    // 列を行に追加
    row.appendChild(dateColumn);
    row.appendChild(weatherColumn);
    row.appendChild(textColumn);
    row.appendChild(deleteButtonColumn);

    // 行をテーブルに追加
    diaryList.appendChild(row);
  }
}

// 日記の追加
document.getElementById("diary-button").onclick = async(e) => {
  e.preventDefault();
  const text = document.getElementById("text-input").value;
  const date = document.getElementById("date-input").value;
  let weather = document.getElementById("weather-input").value;

  if(date === "") {
    window.alert("ひづけをにゅうりょくしてね！");
    return;
  }

  if(text === "") {
    window.alert("にっきをかいてね！")
    return;
  }

  // 天気の自動入力
  if(weather === "") {
    const response = await fetch("/get-weather?date=" + date)
    weather = await response.text();
    if(weather === "-1") {
      window.alert("天気がわからないよ。せっていしてね。")
      return;
    }
  }
  
  const response = await fetch("/get-daydiary?date=" + date)
  if(await response.text() !== "-1"){
    window.alert("その日はにっきがかいてあるよ！");
    return;
  }

  try {
    await fetch("/insert-diary",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        date: date,
        weather: weather,
        text: text,
      })
    });
    window.location.reload();
  } catch (error) {
    console.log(error)
  }
};

// 日記の自動生成(GPT)
document.getElementById("gpt-button").onclick = async (e) => {
  e.preventDefault();
  const words = document.getElementById("gpt-input").value;
  // 処理中のグルグル
  document.getElementById("gpt-button").classList.toggle("is-loading");
  document.getElementById("ai-img").style.visibility = "hidden";

  // GPTに問い合わせ
  const response = await fetch("/generate-gpt",{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      words: words
    })
  });
  document.getElementById("text-input").innerText = await response.text();

  // グルグルの無効化とAI画像の表示
  document.getElementById("gpt-button").classList.toggle("is-loading");
  document.getElementById("ai-img").style.visibility = "visible";
}

// 日記の削除

const handleDeleteButtonClick = async(e) => {
  e.preventDefault();
  // 削除の確認
  if (confirm("けしますか？") === false) {
    return;
  }
  const id = e.target.parentNode.id;
  try {
    await fetch("/delete-diary",{
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: id
      })
    });
    window.location.reload();
  } catch (error) {
    console.log(error)
  }
}
