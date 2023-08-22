        /********************************
        *  DO NOT PUSH ".env"!!!!!!!!  * 
        ********************************/


import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.180.0/http/file_server.ts";
import "https://deno.land/std@0.193.0/dotenv/load.ts"
import { Client } from "https://deno.land/x/mysql@v2.11.0/mod.ts"

serve(async (req) => {
    const pathname = new URL(req.url).pathname;
    // SQL用環境変数
    const MYSQL_HOSTNAME = Deno.env.get("MYSQL_HOSTNAME")
    const MYSQL_USER = Deno.env.get("MYSQL_USER")
    const MYSQL_PASSWORD = Deno.env.get("MYSQL_PASSWORD")
    const MYSQL_DBNAME = Deno.env.get("MYSQL_DBNAME")

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
        
        const command = await mySqlClient.execute(`INSERT INTO diary (??, ??, ??) VALUES (?, ?, ?); `, 
            [
            "date",
            "weather",
            "text",
            new Date(reqJson.date),
            reqJson.weather,
            reqJson.text,
            ]
        )
        
        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        return new Response("successed");
    }

    // 日記の取得
    // 引数:{date}
    if (req.method === "GET" && pathname === "/get-diary") {
        const mySqlClient = await new Client().connect({    // データベースと接続
            hostname: MYSQL_HOSTNAME,
            username: MYSQL_USER,
            password: MYSQL_PASSWORD,
            db: MYSQL_DBNAME
        })

        const command = await mySqlClient.execute(`SELECT * FROM diary;`)

        // MySQLのDBとの通信を終了する
        mySqlClient.close()
        return new Response(JSON.stringify(command.rows));
    }

    return serveDir(req, {
        fsRoot: "public",
        urlRoot: "",
        showDirListing: true,
        enableCors: true,
    });
})
