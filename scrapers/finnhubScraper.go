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

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// quote for certain stocks
func scrapeFinnhub(tickers []string) {
	// load tickers for quotes
	var stockPrices ds.FinnhubStockPrice

	key := "LOAD FROM ENV"

	for i := 1; i < len(tickers)-1; i++ {
		stockPrices.Names = append(stockPrices.Names, tickers[i])

		time.Sleep(time.Second * 2)

		link1 := "https://finnhub.io/api/v1/quote?symbol="
		link2 := "&token="
		link := link1 + tickers[i] + link2 + key

		request, err := http.Get(link)
		if err != nil {
			fmt.Println(err)
		}

		quote, err := ioutil.ReadAll(request.Body)
		if err != nil {
			log.Fatal(err)
		}

		currentTime := time.Now()
		timeString := currentTime.Format("02-Jan-2006")

		stockPrices.Time = append(stockPrices.Time, timeString)

		var quoteObject ds.FinnhubQuote
		json.Unmarshal(quote, &quoteObject)

		stockPrices.Prices = append(stockPrices.Prices, quoteObject)

		fmt.Printf("%d. ticker: %s, current: %.2f, date: %s, PercentChange: %.2f\n", i, tickers[i], stockPrices.Prices[i-1].Current, stockPrices.Time[i - 1], stockPrices.Prices[i - 1].PercentChange)
	}

	// f, err := os.Create("7_29_21.txt")
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// defer f.Close()

	// for i := 0; i < len(stockPrices.Prices); i++ {
	// 	var historic ds.HistoricData
	// 	historic.Date = stockPrices.Time[i]
	// 	historic.Open = fmt.Sprint(stockPrices.Prices[i].Open)
	// 	historic.High = fmt.Sprint(stockPrices.Prices[i].High)
	// 	historic.Low = fmt.Sprint(stockPrices.Prices[i].Low)
	// 	historic.Close = fmt.Sprint(stockPrices.Prices[i].Previous)

	// 	str := historic.Date + "," + historic.Open + "," + historic.High + "," + historic.Low + "," + historic.Close + "\n"

	// 	_, err2 := f.WriteString(str)
	// 	if err2 != nil {
	// 		log.Fatal(err2)
	// 	}
	// }

	// fmt.Println("done")


  var login string
	// connect to the mongoDB database
	uri := "mongodb://" + login + "/StockData?retryWrites=true&w=majority"

	ctx, cancel := context.WithTimeout(context.Background(), 1000*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			panic(err)
		}
	}()

	historicCollection := client.Database("StockData").Collection("Historic")

	for i := 0; i < len(stockPrices.Prices); i++ {
		var historic ds.HistoricData
		historic.Date = stockPrices.Time[i]
		historic.Open = fmt.Sprint(stockPrices.Prices[i].Open)
		historic.High = fmt.Sprint(stockPrices.Prices[i].High)
		historic.Low = fmt.Sprint(stockPrices.Prices[i].Low)
		historic.Close = fmt.Sprint(stockPrices.Prices[i].Previous)
		historic.PercentChange = fmt.Sprint(stockPrices.Prices[i].PercentChange)

		fundamentals, err := historicCollection.Find(context.TODO(), bson.M{"ticker": stockPrices.Names[i]})
		if err != nil {
			log.Fatal(err)
		}

		var results []ds.SymbolData

		if err = fundamentals.All(context.TODO(), &results); err != nil {
			log.Fatal(err)
		}

		results[0].Dat = append(results[0].Dat, historic)

		filter := bson.D{{"ticker", stockPrices.Names[i]}}
		update := bson.D{{"$set", bson.D{
			{"dat", results[0].Dat},
		}}}

		historicResult, err := historicCollection.UpdateOne(context.TODO(), filter, update)
		if err != nil {
			log.Fatal(err)
		}

		if historicResult.MatchedCount != 0 {
			fmt.Println("Updated doc!")
			fmt.Println(results[0].Dat[len(results[0].Dat) - 1])
		}
	}
}
