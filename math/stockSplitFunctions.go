package math

import (
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/bson"
	
	mw "SMA/middleware"
	"time"
	"log"
	"fmt"
	"strconv"
	"context"
	"strings"
	"io/ioutil"
	"net/http"
	"encoding/json"
)

type StockSplit struct {
	Results []struct {
		Ticker			string	`json:"ticker"`
		ExecutionDate	string	`json:"exDate"`
		Ratio			float64	`json:"ratio"`
	} `json:"results"`
	Count	int 	`json:"count"`
}

func checkStockSplit(tickers []string, checkAfterDateS string) () {
	var stockSplitData StockSplit
	var stockSplits []StockSplit

	apiClient := &http.Client{
		Timeout: 100 * time.Second,
	}

	secretKey := "5pkNuU42CAOwv_MMwEke_tY7QAWJSXCv"

	checkAfterDate, err := time.Parse("2006-01-02", checkAfterDateS)
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < len(tickers); i++ {

		time.Sleep(time.Second * 21)

		symbol := tickers[i]
		url := fmt.Sprintf("https://api.polygon.io/v2/reference/splits/%s?&apiKey=%s", symbol, secretKey)

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
		json.Unmarshal([]byte(message), &stockSplitData)
		fmt.Println(stockSplitData.Results)

		if stockSplitData.Count > 0 {
			date, err := time.Parse("2006-01-02", stockSplitData.Results[0].ExecutionDate)
			if err != nil {
				log.Fatal(err)
			}

			if date.After(checkAfterDate) {
				if symbol == stockSplitData.Results[0].Ticker {
					stockSplits = append(stockSplits, stockSplitData)
				}

				fmt.Printf("%s had a stock split after %s", symbol, checkAfterDateS)
			}
		}
	}

	db := mw.CreateConnection()

	for i := 0; i < len(stockSplits); i++ {
		calculateNewPrice(db, stockSplits[i].Results[0].Ticker, stockSplits[i].Results[0].ExecutionDate, stockSplits[i].Results[0].Ratio)
		time.Sleep(time.Second * 21)
	}
}

func calculateNewPrice(db mongo.Database, ticker string, date string, ratio float64) {
	prices := mw.GetQuoteDataByTicker(db, ticker)

	endDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		log.Fatal(err)
	}

	stringEndDate := endDate.Format("02-Jan-2006")
	formattedEndDate, err := time.Parse("02-Jan-2006", stringEndDate)
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < len(prices.Dat); i++ {
		tickerDate, err := time.Parse("02-Jan-2006", prices.Dat[i].Date)
		if err != nil {
			log.Fatal(err)
		}

		if tickerDate.Before(formattedEndDate) {
			openPrice, err := strconv.ParseFloat(prices.Dat[i].Open, 64)
			if err != nil {
				log.Fatal(err)
			}

			highPrice, err := strconv.ParseFloat(prices.Dat[i].High, 64)
			if err != nil {
				log.Fatal(err)
			}

			lowPrice, err := strconv.ParseFloat(prices.Dat[i].Low, 64)
			if err != nil {
				log.Fatal(err)
			}

			closePrice, err := strconv.ParseFloat(prices.Dat[i].Close, 64)
			if err != nil {
				log.Fatal(err)
			}			

			prices.Dat[i].Open = fmt.Sprintf("%f", openPrice * ratio)
			prices.Dat[i].High = fmt.Sprintf("%f", highPrice * ratio)
			prices.Dat[i].Low = fmt.Sprintf("%f", lowPrice * ratio)
			prices.Dat[i].Close = fmt.Sprintf("%f", closePrice * ratio)

			fmt.Printf("%s - %s\n", prices.Dat[i].Date, prices.Dat[i].Close)
		} else {
			break
		}
	}

	historicCollection := db.Collection("Historic")

	filter := bson.D{{"ticker", ticker}}
	update := bson.D{{"$set", bson.D{
		{"dat", prices.Dat},
	}}}

	_, err = historicCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Updated doc!")
}

func getStockSplitData(ticker string) (StockSplit) {
	var stockSplitData StockSplit

	apiClient := &http.Client{
		Timeout: 100 * time.Second,
	}

	secretKey := "5pkNuU42CAOwv_MMwEke_tY7QAWJSXCv"

	symbol := ticker
	url := fmt.Sprintf("https://api.polygon.io/v2/reference/splits/%s?&apiKey=%s", symbol, secretKey)

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
	json.Unmarshal([]byte(message), &stockSplitData)
	fmt.Println(stockSplitData.Results)

	return stockSplitData
}