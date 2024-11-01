package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PolyStruct struct {
	Results struct {
		Ticker            string    `json:"ticker"`
		Name              string    `json:"name"`
		Market            string    `json:"market"`
		Locale            string    `json:"locale"`
		PrimaryExchange   string    `json:"primary_exchange"`
		Type              string    `json:"type"`
		Active            bool      `json:"active"`
		CurrencyName      string    `json:"currency_name"`
		Cik               string    `json:"cik"`
		CompositeFigi     string    `json:"composite_figi"`
		LastUpdatedUtc    time.Time `json:"last_updated_utc"`
		OutstandingShares int       `json:"outstanding_shares"`
		MarketCap         int       `json:"market_cap"`
		Address           struct {
			State string `json:"state"`
		} `json:"address"`
		SicCode        string `json:"sic_code"`
		SicDescription string `json:"sic_description"`
		TickerRoot     string `json:"ticker_root"`
		TickerSuffix   string `json:"ticker_suffix"`
	} `json:"results"`
	Status    string `json:"status"`
	RequestID string `json:"request_id"`
	Count     int    `json:"count"`
}

func scrapePolygon(tickerslice []string) {
	var stock PolyStruct
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(
		"<MongoURI>",
	))
	if err != nil {
		log.Fatal(err)
	}

	err = mongoClient.Ping(context.TODO(), nil)

	if err != nil {
		log.Fatal(err)
	}

	dbEntryPoint := mongoClient.Database("StockData")
	polyCollection := dbEntryPoint.Collection("polygon")

	apiClient := &http.Client{
		Timeout: 100 * time.Second,
	}

	secretKey := "API-KEY"

	for i := 1; i < len(tickerslice)-1; i++ {

		time.Sleep(time.Second * 21)

		symbol := tickerslice[i]
		url := fmt.Sprintf("https://api.polygon.io/vX/reference/tickers/%s?&apiKey=%s", symbol, secretKey)

		resp, err := apiClient.Get(url)
		if err != nil {
			log.Fatal(err)
		}

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Fatal(err)
		}

		message := string(body)
		fmt.Println(message)
		json.Unmarshal([]byte(message), &stock)
		fmt.Println(stock.Results.Ticker)

		result, insertErr := polyCollection.InsertOne(context.TODO(), stock)

		if insertErr != nil {
			fmt.Println("InsertOne ERROR:", insertErr)
		} else {
			fmt.Println("InsertOne() API result:", result)
		}
	}
}
