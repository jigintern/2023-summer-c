        /********************************
        *  DO NOT PUSH ".env"!!!!!!!!  * 
        ********************************/


import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.180.0/http/file_server.ts";
import "https://deno.land/std@0.193.0/dotenv/load.ts"
import { Client } from "https://deno.land/x/mysql@v2.11.0/mod.ts"
import * as CSV from "https://deno.land/std@0.170.0/encoding/csv.ts";
import { fetchChat } from "https://code4fukui.github.io/ai_chat/fetchChat.js";

const message =
`# 命令
以下の「制約」をすべて守った、日記を出力してください。
# 制約
- 2文または3文で構成される。
- 常体で書く。
- 以下の「単語」を使用する。
- 小学生4年生程度の語彙を使用する。
- すべての文字をひらがなまたはカタカナで表記する。
# 単語
`

serve(async (req) => {
    const pathname = new URL(req.url).pathname;
    // SQL用環境変数
    const MYSQL_HOSTNAME = Deno.env.get("MYSQL_HOSTNAME")
    const MYSQL_USER = Deno.env.get("MYSQL_USER")
    const MYSQL_PASSWORD = Deno.env.get("MYSQL_PASSWORD")
    const MYSQL_DBNAME = Deno.env.get("MYSQL_DBNAME")

        /********************************
        *            Diary              * 
        ********************************/
    
    // 日記の追加
    // 引数:{date, weather, text}
    if (req.method === "POST" && pathname === "/insert-diary")
    {
        const reqJson = await req.json();   // 引数を取得
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        let [year, month, date] = reqJson.date.split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + date;

        const command = await mySqlClient.execute(`INSERT INTO diary (??, ??, ??) VALUES (?, ?, ?); `, 
            [
            "date",
            "weather",
            "text",
            day,
            reqJson.weather,
            reqJson.text,
            ]
        )
        
        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        return new Response("successed");
    }

    // すべての日記の取得
    // 引数:なし
    if (req.method === "GET" && pathname === "/get-diary") {
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        const command = await mySqlClient.execute(`SELECT * FROM diary ORDER BY date ASC;`);

        // MySQLのDBとの通信を終了する
        mySqlClient.close();
        return new Response(JSON.stringify(command.rows));
    }

    // 特定の日付の日記の取得
    // 引数:{date}
    if (req.method === "GET" && pathname === "/get-daydiary") {
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        let [year, month, date] = new URL(req.url).searchParams.get("date").split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + date;

        const command = await mySqlClient.execute(`SELECT * FROM diary WHERE ?? = ? ORDER BY date ASC;`,
        [
            "date",
            day,
        ]);

        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        if (Object.keys(command.rows).length == 0) {
            return new Response("-1")
        } else {
            return new Response(command.rows[0]["text"]);
        }
    }

    // 日記を削除
    // 引数:{id}
    if (req.method === "POST" && pathname === "/delete-diary")
    {
        const reqJson = await req.json();   // 引数を取得
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })
        
        const command = await mySqlClient.execute(`DELETE FROM diary WHERE (?? = ?); `, 
            [
            "id",
            reqJson.id,
            ]
        )
        
        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        return new Response("successed");
    }

    // 指定した月の中で日記が書かれている日の日付一覧を返す
    // 引数:{date}
    if (req.method === "POST" && pathname === "/diary-date")
    {
        const reqJson = await req.json();   // 引数を取得
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })
        
        
        let [year, month, date] = reqJson.date.split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + '%';
        
        const command = await mySqlClient.execute(`SELECT date FROM diary WHERE date LIKE ? ORDER BY date ASC; `,
            [
                day
            ]
        )
        // MySQLのDBとの通信を終了する
        mySqlClient.close();

        const json = command.rows;
        let datelist = [];
        let tmp;
        for (let i=0;i<Object.keys(json).length;i++) {
            tmp = json[i]["date"];
            datelist.push(tmp);
        }

        return new Response(datelist);
    }


        /********************************
        *            Weather            * 
        ********************************/

    // 過去の天気をCSVから取得
    // 引数:{date}
    if (req.method === "GET" && pathname === "/get-weather") {
        const param = new URL(req.url).searchParams.get("date");
        const path = new URL(import.meta.resolve("./public/weather.csv"));
        const text = await Deno.readTextFile(path);
        const data = CSV.parse(text);
        data.splice(0, 4);
        const firstdate = new Date(data[0][0]);
        const requestdate = new Date(param);
        const diffDay = Math.floor((requestdate.getTime() - firstdate.getTime()) / (1000 * 60 * 60 * 24));
        try {
            switch (data[diffDay][1][0]) {
                case "晴":
                case "快":
                    return new Response(0);
                case "曇":
                case "薄":
                    return new Response(1);
                case "雨":
                case "大":
                case "雪":
                    return new Response(2);
            }
        }
        catch {
            return new Response(-1);
        }
    }

        /********************************
        *            Event              * 
        ********************************/

    // 予定の追加
    // 引数:{date, name}
    if (req.method === "POST" && pathname === "/insert-event")
    {
        const reqJson = await req.json();   // 引数を取得
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        let [year, month, date] = reqJson.date.split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + date;
        
        const command = await mySqlClient.execute(`INSERT INTO schedule (??, ??) VALUES (?, ?); `, 
            [
            "date",
            "name",
            day,
            reqJson.name,
            ]
        )
        
        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        return new Response("successed");
    }

    // 予定の削除
    // 引数:{id}
    if (req.method === "POST" && pathname === "/delete-event")
    {
        const reqJson = await req.json();   // 引数を取得
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })
        
        const command = await mySqlClient.execute(`DELETE FROM schedule WHERE (?? = ?);`, 
            [
            "id",
            reqJson.id,
            ]
        )
        
        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        return new Response("successed");
    }

    // すべての予定の取得
    // 引数:なし
    if (req.method === "GET" && pathname === "/get-event") {
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        const command = await mySqlClient.execute(`SELECT * FROM schedule ORDER BY date ASC;`);

        // MySQLのDBとの通信を終了する
        mySqlClient.close();
        return new Response(JSON.stringify(command.rows));
    }

    // 予定の取得
    // 引数:{date}
    if (req.method === "GET" && pathname === "/get-event-one") {
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        let [year, month, date] = new URL(req.url).searchParams.get("date").split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + date;

        const command = await mySqlClient.execute(`SELECT ?? FROM schedule WHERE date = ? ORDER BY date ASC;`,
        [
            "name",
            day
        ]);
        // MySQLのDBとの通信を終了する
        mySqlClient.close();
        if (Object.keys(command.rows).length == 0) {
            return new Response("-1")
        } else {
            return new Response(command.rows[0]["name"]);
        }
    }

    // 指定した月の中で予定が書かれている日の日付一覧を返す
    // 引数:{date}
    if (req.method === "POST" && pathname === "/event-date")
    {
        const reqJson = await req.json();   // 引数を取得
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })
        
        
        let [year, month, date] = reqJson.date.split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + '%';
        
        const command = await mySqlClient.execute(`SELECT date FROM schedule WHERE date LIKE ? ORDER BY date ASC; `,
            [
                day
            ]
        )
        // MySQLのDBとの通信を終了する
        mySqlClient.close();

        const json = command.rows;
        let datelist = [];
        let tmp;
        let tmpdate, tmpmonth, tmpyear;
        for (let i=0;i<Object.keys(json).length;i++) {
            tmp = json[i]["date"];
            datelist.push(tmp);
        }

        return new Response(datelist);
    }

        /********************************
        *           ChatGPT             * 
        ********************************/
    
    // 単語から日記を生成
    // 引数:{words}
    if (req.method === "POST" && pathname === "/generate-gpt")
    {
        const reqJson = await req.json();
        const word = reqJson.words.split(/\s/);
        let question = message;
        for (let i=0;i<word.length;i++)
            question += "- " + word[i] + "\n";
        const response = await fetchChat(question);
        return new Response(response);
    }

    // 予定から日記を生成
    // 引数:{date}
    if (req.method === "POST" && pathname === "/event-gpt")
    {
        const reqJson = await req.json();
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        let [year, month, date] = reqJson.date.split('-');
        month = month.padStart(2, '0');
        date = date.padStart(2, '0');
        const day = year + '-' + month + '-' + date;

        const command = await mySqlClient.execute(`SELECT * FROM schedule WHERE date = ? ORDER BY date ASC;`,
        [
            day
        ]);

        console.log(command.rows);
        // MySQLのDBとの通信を終了する
        mySqlClient.close();

        let question = message;
        for (let i=0;i<Object.keys(command.rows).length;i++)
            question += "- " + command.rows[i]["name"] + '\n';
        console.log(question);
        const response = await fetchChat(question);
        return new Response(response);
    } 

    return serveDir(req, {
        fsRoot: "public",
        urlRoot: "",
        showDirListing: true,
        enableCors: true,
    });
})
