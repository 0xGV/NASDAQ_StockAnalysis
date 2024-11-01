package main

import (
	ds "SMA/data"
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

func scrapeAlphaVantage(tickerslice []string) {

	var stock ds.AlphaStruct
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(
		"MongoURI",
	))
	if err != nil {
		log.Fatal(err)
	}

	err = mongoClient.Ping(context.TODO(), nil)

	if err != nil {
		log.Fatal(err)
	}

	dbEntryPoint := mongoClient.Database("StockData")
	alphaCollection := dbEntryPoint.Collection("alpha")

	client := &http.Client{
		Timeout: 100 * time.Second,
	}

	secretKey := "API-KEY"

	for i := 1; i < len(tickerslice)-1; i++ {
		if i%500 == 0 {
			time.Sleep(time.Hour * 24)
		}
		time.Sleep(time.Second * 21)
		symbol := tickerslice[i]
		url := fmt.Sprintf("https://www.alphavantage.co/query?function=OVERVIEW&symbol=%s&apikey=%s", symbol, secretKey)

		resp, err := client.Get(url)
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
		fmt.Println(stock.Symbol)

		result, insertErr := alphaCollection.InsertOne(context.TODO(), stock)

		if insertErr != nil {
			fmt.Println("InsertOne ERROR:", insertErr)
		} else {
			fmt.Println("InsertOne() API result:", result)
		}

	}
}
