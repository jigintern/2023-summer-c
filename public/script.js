// 開始時に実行する
// 日記の全件取得
window.onload = async () => {
  const response = await fetch("get_diary");
  const json = await response?.json();
  if (json && json["diaries"] !== undefined) {
    for (const diary of json["diaries"]) {
      document.getElementById("diary-list").innerHTML +=
      `
      <tr class="id" id="id"><td id="date">${date}</td><td class="weather" id="weather"><img class="img" src="${weather}.png" alt="weather"/></td><td class="text" id="text">${text}</td></tr>`
    }
  }
}
