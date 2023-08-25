import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const apikey = "dj00aiZpPWtSOXZCOERCc3NzNyZzPWNvbnN1bWVyc2VjcmV0Jng9ZTU-";



export class WetherData {
    constructor() {
        this.prefs = {};
        this.areas = {};
    }
    

    async getPhpsessid() {
        const doc = new DOMParser().parseFromString(
            await fetchHtml("http://www.data.jma.go.jp/gmd/risk/obsdl/index.php"),
            "text/html",
        );
        return doc.querySelector("input#sid").getAttribute("value");
    }

    async getPrefectures() {
        const res = await fetch('https://www.data.jma.go.jp/stats/etrn/select/prefecture00.php');
        const htmlData = await res.text();
        const doc = new DOMParser().parseFromString(htmlData, 'text/html');
        const areas = doc.querySelectorAll('area');
        areas.forEach((pref) => {
            const name = pref.getAttribute('alt');
            const href = pref.getAttribute('href');

            // href内のprec_noだけ取り出すのにダミーURLからSearchParamsを取得する
            const url = new URL(href, 'http://example.com');
            const prefId = url.searchParams.get('prec_no');
            this.prefs[prefId] = name;
        });
    }

    async getAreas(prefId) {
        const url = new URL('https://www.data.jma.go.jp/stats/etrn/select/prefecture.php');
        url.searchParams.append('prec_no', prefId);

        const res = await fetch(url);
        const htmlData = await res.text();
        const doc = new DOMParser().parseFromString(htmlData, 'text/html');
        const areas = doc.querySelectorAll('area');
        areas.forEach((area) => {
            const name = area.getAttribute('alt');
            const href = area.getAttribute('href');

            // href内のprec_noだけ取り出すのにダミーURLからSearchParamsを取得する
            const url = new URL(href, 'http://example.com');
            const blockId = url.searchParams.get('block_no');
            if (blockId !== '') {
                this.areas[blockId] = name;
            }
        });
    }

    async getWether(prefId, blockId, year, month, day) {
        const url = new URL('https://www.data.jma.go.jp/stats/etrn/view/daily_s1.php');
        url.searchParams.append('prec_no', prefId);
        url.searchParams.append('block_no', blockId);
        url.searchParams.append('year', year);
        url.searchParams.append('month', month);

        const res = await fetch(url);
        const htmlData = await res.text();
        const doc = new DOMParser().parseFromString(htmlData, 'text/html');

        try {
        const rows = doc.querySelector('#tablefix1 tbody').querySelectorAll('tr');
        const targetRow = rows[day + 3];
        const weather = Array.from(targetRow.querySelectorAll('td')).slice(-2, -1)[0].textContent.trim();
        return weather;
        } catch {
            return null;
        }
    }
}

const data = new WetherData();
let csvtext = ""

// 県一覧
await data.getPrefectures();
for (let i=0;i<100;i++)
    if (data.prefs[`${i}`] != undefined)
        csvtext += data.prefs[`${i}`] + ", \n";

function download_txt(file_name, data) {

    const blob = new Blob([data], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.download = file_name;
    a.href = url;
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    
}

download_txt(csvtext);

console.log(csvtext);

/*
for (let i=0;i<Object.keys(data.prefs);i++) {
    console.log(data.prefs.toString().split());
}
*/

// 特定の県のエリア一覧
// await data.getAreas(51);
// console.log(data.areas);

// 天気を聞く
// const weather = await data.getWether(51, 47636, 2022, 8, 24);
// console.log(weather);


// export async function getPrefecture(lat, lon){
//     let accessUrl = "https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?output=json&lat=" + lat + "&lon=" + lon + "&appid=" + apikey;
//     const res = await fetch(accessUrl);
//     const json = await res.json();
//     const prefecture = json.Feature[0].Property.AddressElement[0].Name
//     console.log(json.Feature[0])
//     console.log(json.Feature[0].Property)
//     console.log(prefecture);
// }

//getPrefecture("35.930896", "139.791361")