// ページ読み込み時に実行
window.onload = async () => {

    // カレンダーが書かれている全日付を取得
    const response = await fetch("/diary-date", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            date: "2023-8-20"
        })
    })

    console.log(response.text());
}