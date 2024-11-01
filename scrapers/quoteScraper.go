package main

import (
	ds "SMA/data"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

func scrapeFinnhubv2(tickers []string) {
	var stock ds.HistoricData
	client := http.Client {
		Timeout: 100 * time.Second,
	}

	secretKey := "API_KEY"

	for i := 1; i < len(tickers)-1; i++ {
		time.Sleep(time.Second * 2)
		symbol := tickers[i]
		url := fmt.Sprintf("https://finnhub.io/api/v1/quote?symbol=%s&token=%s", symbol, secretKey)
		
		resp, err := client.Get(url)
		if err != nil {
			log.Fatal(err)
		}

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Fatal(err)
		}

		message := string(body)
		fmt.Println(symbol)
		fmt.Println(message)
		json.Unmarshal([]byte(message), &stock)
		fmt.Println(stock.Ticker)
	}
}
