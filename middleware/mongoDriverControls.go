package mw

import (
	ds "SMA/data"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

/*
* getDataByTicker(mongo.Client,ticker,dataStruct)
* Requires an active mongo client, the requested ticker and a datastruct to return the information
* into
 */

func GetFundamentalDataByTicker(db mongo.Database, ticker string) ds.AlphaStruct {

	alphaCollection := db.Collection("alpha")
	//remove later
	_ = alphaCollection

	fundamentals, err := alphaCollection.Find(context.TODO(), bson.M{"symbol": ticker})
	if err != nil {
		log.Fatal(err)
	}

	var results []ds.AlphaStruct

	if err = fundamentals.All(context.TODO(), &results); err != nil {
		log.Fatal(err)
	}
	return results[0]

}

func GetQuoteDataByTicker(db mongo.Database, ticker string) ds.SymbolData {

	historicCollection := db.Collection("Historic")

	fundamentals, err := historicCollection.Find(context.TODO(), bson.M{"ticker": ticker})
	if err != nil {
		log.Fatal(err)
	}

	var results []ds.SymbolData

	if err = fundamentals.All(context.TODO(), &results); err != nil {
		log.Fatal(err)
	}
	return results[0]
}

// gets math data from mongoDB
func GetMathDataByTicker(db mongo.Database, ticker string) ds.MathData {
	var mathResults []ds.MathData

	// ask for name of collection!
	mathCollection := db.Collection("Math")
	mathdata, err := mathCollection.Find(context.TODO(), bson.M{"ticker": ticker})
	if err != nil {
		log.Fatal(err)
	}

	if err = mathdata.All(context.TODO(), &mathResults); err != nil {
		log.Fatal(err)
	}

	if len(mathResults) == 0 {
		var empty ds.MathData
		return empty
	}

	return mathResults[0]
}

func CreateConnection() mongo.Database {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(
		"mongodb://<RemoteAddressHere>/StockData?retryWrites=true&w=majority",
	))
	if err != nil {
		log.Fatal(err)
	}
	err = mongoClient.Ping(context.TODO(), nil)

	if err != nil {
		log.Fatal(err)
	}
	dbEntryPoint := mongoClient.Database("StockData")

	return *dbEntryPoint
}

// inserts math data created into mongodb
func InsertMathData(db mongo.Database, math ds.MathData) {
	// ask for name of collection!
	mathCollection := db.Collection("Math")
	var insertedIds []interface{}

	filter := bson.D{{"ticker", math.Ticker}}
	update := bson.D{{"$set", bson.D{
		{"SMA", math.SMA},
		{"EMA", math.EMA},
		{"MACD", math.MACD},
		{"MACDsignal", math.MACDsignal},
		{"RSI", math.RSI},
		{"midBand", math.MidBand},
		{"lowBand", math.LowBand},
		{"highBand", math.HighBand},
		{"dates", math.Dates},
	}}}

	mathResult, err := mathCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}

	if mathResult.MatchedCount == 0 {
		mathResult, err := mathCollection.InsertOne(context.TODO(), bson.D{
			{"ticker", math.Ticker},
			{"SMA", math.SMA},
			{"EMA", math.EMA},
			{"MACD", math.MACD},
			{"MACDsignal", math.MACDsignal},
			{"RSI", math.RSI},
			{"midBand", math.MidBand},
			{"lowBand", math.LowBand},
			{"highBand", math.HighBand},
			{"dates", math.Dates},
		})
		if err != nil {
			log.Fatal(err)
		}

		id := mathResult.InsertedID
		insertedIds = append(insertedIds, id)

		fmt.Println("Added document!")
	} else {
		fmt.Printf("Updated document!\n")
	}
}

/*
func main() {
	getDataByTicker(*dbEntryPoint, "TSLA")
}
*/
