
export async function getPrefecture(lat, lon){
  let accessUrl = "https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?output=json&lat=" + lat + "&lon=" + lon + "&appid=dj00aiZpPWZsWDE5SVQ0S29WTCZzPWNvbnN1bWVyc2VjcmV0Jng9ODY-" 
  const res = await fetch(accessUrl);
  const json = await res.json();
  const prefecture = json.Feature[0].Property.AddressElement[0].Name
  console.log(json.Feature[0])
  console.log(json.Feature[0].Property)
  console.log(prefecture);
}


