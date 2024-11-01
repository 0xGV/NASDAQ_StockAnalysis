package math

import (
	//	"github.com/gin-gonic/gin"
	ds "SMA/data"
	mw "SMA/middleware"

	//util "SMA/util"
	"math"
	"strconv"

	//	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

type Mfloat struct {
	Ticker string
	Prices []float64
	Dates  []string
}

// Indicators functions
// Sum returns the sum of all elements of 'data'.
func Sum(data []float64) float64 {

	var sum float64

	for _, x := range data {
		sum += x
	}

	return sum
}

// Avg returns 'data' average.
func Avg(data []float64) float64 {

	return Sum(data) / float64(len(data))
}

// AddToAll adds a value to all slice elements.
func (slice Mfloat) AddToAll(val float64) []float64 {

	var addedSlice []float64

	for i := 0; i < len(slice.Prices); i++ {
		addedSlice = append(addedSlice, slice.Prices[i]+val)
	}

	return addedSlice
}

// calculate simple moving average for a time period
func (slice Mfloat) SMA(period int) []float64 {

	var result []float64

	for i := period; i <= len(slice.Prices); i++ {
		result = append(result, Sum(slice.Prices[i-period:i])/float64(period))
	}

	return result
}

// calculates the exponential moving average for a time period (days)
func (slice Mfloat) EMA(totalPeriods int) []float64 {
	EMA := make([]float64, 0)
	multiplier := float64(2.0 / (float64(totalPeriods) + 1.0))

	// calculate the SMA for the first # of days
	SMA := slice.SMA(totalPeriods)
	if len(SMA) > 0 {
		EMA = append(EMA, SMA[0])
	}

	totalPeriods++

	for i := totalPeriods; i <= len(slice.Prices); i++ {
		nextEMA := (slice.Prices[i-1] * multiplier) + (EMA[i-totalPeriods] * (1 - multiplier))
		EMA = append(EMA, nextEMA)
	}

	return EMA
}

// calculates the moving average convergence divergence for a chosen time period
func (slice Mfloat) MACD() ([]float64, []float64) {
	var MACD Mfloat
	// calculate 12-period and 26-period EMA
	EMA12 := slice.EMA(12)
	EMA26 := slice.EMA(26)

	for i := 0; i < len(EMA26); i++ {
		nextMACD := EMA12[i+14] - EMA26[i]
		MACD.Prices = append(MACD.Prices, nextMACD)
	}

	signal := MACD.EMA(9)

	return MACD.Prices, signal
}

// returns standard deviation of a slice.
func Std(slice []float64) float64 {

	var result []float64

	mean := Avg(slice)

	for i := 0; i < len(slice); i++ {
		result = append(result, math.Pow(slice[i]-mean, 2))
	}

	return math.Sqrt(Sum(result) / float64(len(result)))
}

// BollingerBands returns upper band, lower band and simple moving
// average of a slice.
func BollingerBands(slice Mfloat, period int, nStd float64) ([]float64, []float64, []float64) {
	var middleBand Mfloat

	multiplier := 0.3
	middleBand.Prices = slice.SMA(period)
	std := Std(middleBand.Prices)
	upperBand := middleBand.AddToAll(std * nStd * multiplier)
	lowerBand := middleBand.AddToAll(-1.0 * std * nStd * multiplier)

	return middleBand.Prices, upperBand, lowerBand
}

func RSI(slice Mfloat) []float64 {
	var gain []float64
	var loss []float64
	var avgGain []float64
	var avgLoss []float64
	var rs []float64
	var rsi []float64

	for i := 1; i < len(slice.Prices); i++ {
		change := slice.Prices[i] - slice.Prices[i-1]

		if change <= 0 {
			loss = append(loss, -change)
			gain = append(gain, 0)
		} else if change > 0 {
			loss = append(loss, 0)
			gain = append(gain, change)
		}
	}

	sumG := 0.0
	sumL := 0.0

	for i := 0; i < 14; i++ {
		sumG += gain[i]
		sumL += loss[i]
	}

	avgG := sumG / 14
	avgL := sumL / 14

	avgGain = append(avgGain, avgG)
	avgLoss = append(avgLoss, avgL)

	for i, j := 14, 0; i < len(gain); i, j = i+1, j+1 {
		sumG = gain[i] + (avgGain[j] * 13)
		sumL = loss[i] + (avgLoss[j] * 13)

		avgG := sumG / 14
		avgL := sumL / 14

		avgGain = append(avgGain, avgG)
		avgLoss = append(avgLoss, avgL)
	}

	for i := 0; i < len(avgGain); i++ {
		rs = append(rs, avgGain[i]/avgLoss[i])
	}

	for i := 0; i < len(rs); i++ {
		if avgLoss[i] == 0 {
			rsi = append(rsi, 100)
		} else {
			rsi = append(rsi, 100-(100/(1+rs[i])))
		}
	}

	return rsi
}

// creates an mfloat object given a ticker, an array of desired prices
// and an array of dates
func CreateMfloat(ticker string, prices []float64, dates []string) Mfloat {
	var price Mfloat

	for i := 0; i < len(prices); i++ {
		price.Ticker = ticker
		price.Prices = append(price.Prices, prices[i])
		price.Dates = append(price.Dates, dates[i])
	}

	return price
}

// returns the mathData object
func DoMathForTicker(db mongo.Database, ticker string) ds.MathData {
	stockPrices := mw.GetQuoteDataByTicker(db, ticker)

	var pclose []float64
	var dates []string

	for i := 0; i < len(stockPrices.Dat); i++ {
		price, err := strconv.ParseFloat(stockPrices.Dat[i].Close, 64)
		if err == nil {
			pclose = append(pclose, price)
		}

		dates = append(dates, stockPrices.Dat[i].Date)
	}

	slice := CreateMfloat(ticker, pclose, dates)

	var techI ds.MathData

	techI.Ticker = slice.Ticker

	if len(slice.Prices) > 1 {
		techI.SMA = slice.SMA(10)
		techI.EMA = slice.EMA(10)
	}

	if len(slice.Prices) > 14 {
		techI.RSI = RSI(slice)
		techI.MidBand, techI.HighBand, techI.LowBand = BollingerBands(slice, 14, 2)
	}

	techI.Dates = slice.Dates

	if len(slice.Prices) >= 34 {
		techI.MACD, techI.MACDsignal = slice.MACD()
	}

	return techI
}