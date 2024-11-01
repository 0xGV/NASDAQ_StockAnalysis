/*
Author: Gianni Vaiente
9/25/2021
Partitioning and analysis of EOD stock data to determine a trend.
*/

//first 4 years, then check results on the 5th (current year)
// Average trading days 253 / year 63 / quarter. 21 / month

package stockpicker

import (
	ds "SMA/data"
	mw "SMA/middleware"
	"SMA/util"
//	"encoding/json"
	"fmt"
//	"io/ioutil"
	"math"
	"sort"
	"strconv"
	"sync"

	"go.mongodb.org/mongo-driver/mongo"
	"gonum.org/v1/gonum/stat"
)

//Const Variables
const TOLERANCE = 10
const PERIODLENGHT = 500
const MINRAW = -2500
const TRADEDAYSPERYEAR = 253
const TRADEDAYSPERQUARTER = 63
const TRADEDAYSPERMONTH = 21
const NOYEARS = 6
const ANALYSISRANGE = 4
//An enum to describe the direction of a time series.
type movement int
const (
	growth movement = iota
	decline
	neutral
)
type rating int
const (
  Ssell = iota
  sell
  observe
  buy
  Sbuy
)

var testingMap = map[string]forwardData{}
var mutex = &sync.RWMutex{}

type forwardData struct{
  symbol string
  periodStats [4]float64
  priceData []float64
  Rating rating
}

type partition struct {
	start         int
	end           int
	direction     int
	values        []float64
	percentChange float64
	length        int
	slope         float64
}

type trendData struct {
	dir                  movement
	percentChangePrevDay float64
}

type Eod struct {
  Stats []EodStats
  Mean float64
  Variance float64
  Stdev float64
}

type EodStats struct {
  Symbol     string `json:"symbol"`
	Normalized float64
	Raw        float64
  Rating   rating
}

//convert the string formatted data into workable float values.
func dataToFloat(dat ds.SymbolData) []float64 {
	tmp := make([]float64, len(dat.Dat))
	for i := range dat.Dat {
		tmp[i], _ = strconv.ParseFloat(dat.Dat[i].Close, 64)
	}
	return tmp
}

func CalcIndex(symbol string ,db mongo.Database) (float64, string) {
	//pull data
	symbolDat := mw.GetQuoteDataByTicker(db, symbol)
	dat := dataToFloat(symbolDat)
  if len(dat) < TRADEDAYSPERYEAR * NOYEARS{
   return -1, "INVALID"
 }

 historicDat := dat[:TRADEDAYSPERYEAR*ANALYSISRANGE]
    temp := forwardData{
      symbol: symbol,
      priceData: dat[TRADEDAYSPERYEAR*ANALYSISRANGE:],
    }
    mutex.Lock()
    testingMap[symbol] = temp
    mutex.Unlock()
    //fmt.Println(testingMap[symbol])
  //Trim the dat partition. 
  //Deteremine percentage change for the leftover partition.


	trends := identifyTrends(historicDat)
	//fmt.Println(trends)
	//fmt.Println(len(trends))

	tmp := dpartitionTimeSeries(historicDat, trends, TOLERANCE, 4)
	/*for _, s := range tmp {
		fmt.Println(s)
	}*/
	//fmt.Printf("Number of first pass partitions: %d\n", len(tmp))

  tmp2 := mergePartitons(tmp,historicDat)

	/*for _, s := range tmp2 {
		fmt.Println(s)
	}*/
	//fmt.Printf("Number of merged partitions: %d\n", len(tmp2))

	calcRegressions(tmp2)
	score, sym := computeIndex(tmp2), symbol
	//fmt.Printf("Symbol: %s  Score: %f\n", sym, score)
	return score, sym
}

func identifyTrends(timeSeries []float64) []trendData {
	status := make([]trendData, len(timeSeries))

	currIndex := 0.0
	lastIndex := 0.0

	for i, s := range timeSeries {
		currIndex = s
		if i == 0 {
			status[i].dir = neutral
		} else {
			if currIndex < lastIndex {
				status[i].dir = decline
				status[i].percentChangePrevDay = (1 - (timeSeries[i] / timeSeries[i-1])) * 100
				status[i].percentChangePrevDay = math.Round(status[i].percentChangePrevDay*100) / 100
			} else if currIndex > lastIndex {
				status[i].dir = growth
				status[i].percentChangePrevDay = (1 - (timeSeries[i-1] / timeSeries[i])) * 100
				status[i].percentChangePrevDay = math.Round(status[i].percentChangePrevDay*100) / 100
			} else {
				status[i].dir = neutral
			}

		}
		lastIndex = currIndex
	}

	return status
}

/*
* partition Time Series
* This consumes time series data for a stock and returns a list of sections containing a tuple representing partition points.
*
 */
func dpartitionTimeSeries(timeSeries []float64, trends []trendData, tolerance float64, periodLength int) []partition {
	var tmp = make([]partition, 0)

	updatedTrends := trends

	partitionStart := 0
	partitionEnd := partitionStart
	_ = partitionEnd
	_ = updatedTrends
	partitionLength := 0
	_ = partitionLength
	sum := 0.0
	p := 0
	for i, s := range trends {
		p++
		if s.dir == growth {
			sum += s.percentChangePrevDay
		} else if s.dir == decline {
			sum -= s.percentChangePrevDay
		} else {
			sum += 0
		}

		if math.Abs(sum) >= tolerance || p > len(trends) {
			for j := i; j < len(timeSeries); j++ {
				if trends[j].dir != s.dir {
					break
				}
				partitionEnd++

			}
			part := makePartition(partitionStart, i, int(s.dir), timeSeries)
			tmp = append(tmp, part)
			//set new partition start
			partitionStart = i + 1
			partitionEnd = partitionStart + 1
			sum = 0
			p = 0
		}

	}

	if partitionEnd < len(timeSeries) {
		partitionEnd = len(timeSeries)
		part := makePartition(partitionStart, partitionEnd-1, int(trends[partitionStart].dir), timeSeries)
		tmp = append(tmp, part)
	}
	return tmp
}

func makePartition(s, e int, dir int, timeSeries []float64) partition {
	tmp := partition{
		start:     s,
		end:       e,
		direction: dir,
	}
	tmp.values = timeSeries[s : e+1]

	//tmp.percentChange = tmp.values[]
	return tmp
}

func calcRegressions(p []partition) {
	for i, s := range p {
		xvalues := make([]float64, 0)
		for j := s.start; j <= s.end; j++ {
			xvalues = append(xvalues, float64(j))
		}
		_, a := stat.LinearRegression(xvalues, s.values, nil, false)
		p[i].slope = a
		//fmt.Printf("Coeficient of partition %d : %f\n", i, a)
	}

}

func computeIndex(p []partition) float64 {
	var sum float64
	for _, s := range p {
		if !math.IsNaN(s.slope) {
			sum += s.slope * (float64(s.end) - float64(s.start))
		}

	}
	//fmt.Printf(" Score: %f\n", sum)
	return sum
}

//Check current partiton direction,
// peak ahead until the last partition is no longer the same direction.
// create a new partition with the start being the logged positiont
// and the end is last - 1 checked position.
func mergePartitons(parts []partition, timeSeries []float64) []partition {

	tmp := make([]partition, 0)

	for i, j := 0, 1; i < len(parts); i = j {
		hasNext := false
		if i >= len(parts) {
			break
		}
		j = i + 1
		if j >= len(parts) {
			j = len(parts) - 1
		}
		curr := parts[i]
		for curr.direction == parts[j].direction {
			hasNext = true
			j++
			if j >= len(parts) {
				break
			}
		}
		if hasNext {
			//fmt.Printf("Merge %d - %d \n", curr.start, parts[j-1].end)
			tmp = append(tmp, makePartition(curr.start, parts[j-1].end, curr.direction, timeSeries))
		} else {
			//fmt.Printf("Merge %d - %d \n", curr.start, parts[i].end)
			tmp = append(tmp, makePartition(curr.start, parts[i].end, curr.direction, timeSeries))
		}
	}

	return tmp
}

/*This function will format the Eod struct that will later be written to a json file for uploading.*/
func ComputeNormalizedValue(dat []EodStats) (rEod Eod){
  mean := 0.0
  sum := 0.0
  variance := 0.0
  iVar := make([]float64,len(dat))
  dev := 0.0
  for i := range dat{
//Handling cases with extreme lows
  if dat[i].Raw > MINRAW {
    sum = sum + dat[i].Raw
  } else {
   dat[i].Raw = MINRAW
   sum = sum + dat[i].Raw
  }
}
  mean = sum / float64(len(dat))
  _ = mean

  //Get variance
 vsum := 0.0
 for i := range dat {
   iVar[i] =  dat[i].Raw - mean
   iVar[i] = iVar[i] * iVar[i]
   vsum = vsum + iVar[i]
 }
 variance = vsum/float64(len(iVar))
 dev = math.Sqrt(variance)
	for i := range dat {
		dat[i].Normalized = (dat[i].Raw  - mean) / dev
  }
 rEod.Mean = mean
 rEod.Variance = variance
 rEod.Stdev = dev
 rEod.Stats = dat
 return
}


func ComputeNormalizedValueMACD(dat []MACDstats) (r MACD){
  mean := 0.0
  sum := 0.0
  variance := 0.0
  iVar := make([]float64,len(dat))
  dev := 0.0
  for i := range dat{
//Handling cases with extreme lows
  if dat[i].Raw > MINRAW {
    sum = sum + dat[i].Raw
  } else {
   dat[i].Raw = MINRAW
   sum = sum + dat[i].Raw
  }
}
  mean = sum / float64(len(dat))
  _ = mean

  //Get variance
 vsum := 0.0
 for i := range dat {
   iVar[i] =  dat[i].Raw - mean
   iVar[i] = iVar[i] * iVar[i]
   vsum = vsum + iVar[i]
 }
 variance = vsum/float64(len(iVar))
 dev = math.Sqrt(variance)
	for i := range dat {
		dat[i].Normalized = (dat[i].Raw  - mean) / dev
  }
 r.Mean = mean
 r.Variance = variance
 r.Stdev = dev
 r.Stats = dat
 return
}



func FitBins(dat Eod) []int {
  //Bins 
  /* 0     1       2       3     4     5     6     7
  [< -3][-3 -2] [-2 -1] [-1 0] [0 1] [1 2] [2 3] [> 3]*/
  bin := make([]int,5)
  for i := range dat.Stats {
    tmp :=  dat.Stats[i].Normalized
    if tmp <= -3 {
    bin[0] += 1
    dat.Stats[i].Rating = Ssell
    } else if tmp  > -3 && tmp < -1 {
    bin[1] += 1
    dat.Stats[i].Rating = sell
    } else if tmp  > -1 && tmp <  1 {
    bin[2] += 1
    dat.Stats[i].Rating = observe
    } else if tmp  > 1 && tmp < 3 {
    bin[3] += 1
    dat.Stats[i].Rating = buy
    } else{
    bin[4] += 1
    dat.Stats[i].Rating = Sbuy
    }
  }
  return bin
}

func FitBinsMACD(dat MACD) []int {
  //Bins 
  /* 0     1       2       3     4     5     6     7
  [< -3][-3 -2] [-2 -1] [-1 0] [0 1] [1 2] [2 3] [> 3]*/
  bin := make([]int,5)
  for i := range dat.Stats {
    tmp :=  dat.Stats[i].Normalized
    if tmp <= -3 {
    bin[0] += 1
    dat.Stats[i].Rating = Ssell
    } else if tmp  > -3 && tmp < -1 {
    bin[1] += 1
    dat.Stats[i].Rating = sell
    } else if tmp  > -1 && tmp <  1 {
    bin[2] += 1
    dat.Stats[i].Rating = observe
    } else if tmp  > 1 && tmp < 3 {
    bin[3] += 1
    dat.Stats[i].Rating = buy
    } else{
    bin[4] += 1
    dat.Stats[i].Rating = Sbuy
    }
  }
  return bin
}



func EodAnalysisEngine() {
	var wg sync.WaitGroup

	stat := make([]EodStats, 0)
	tickers := util.ReadTickerList("../util/NASDAQ.txt")
	wg.Add(len(tickers))
	_ = tickers
	db := mw.CreateConnection()
	for i, s := range tickers {
		go func(i int, s string) {
			sco, name := CalcIndex(s, db)
			var tmp EodStats
      //Check here for valid data
      if name != "INVALID"{
			tmp.Raw = sco
			tmp.Symbol = name
			stat = append(stat, tmp)
    }
			wg.Done()
		}(i, s)
	}
	wg.Wait()
  statpak := ComputeNormalizedValue(stat)
	sort.SliceStable(statpak.Stats, func(i, j int) bool {
		return statpak.Stats[i].Normalized < statpak.Stats[j].Normalized
	})
  FitBins(statpak)
  BackTestEOD(statpak)
  /*bins,_  := json.MarshalIndent(FitBins(statpak),"", " ")
  blob,_  := json.MarshalIndent(statpak,"", " ")
  _ = ioutil.WriteFile("5yrEODBins.json",bins,0777)
  _ = ioutil.WriteFile("5YrEODResults.json",blob,0777)
  fmt.Println("Hi")*/
}

func BackTestEOD(eod Eod){
  var err = 0
  for i := range eod.Stats{
      temp := testingMap[eod.Stats[i].Symbol]
      temp.Rating = eod.Stats[i].Rating
      temp.periodStats[0] = PercentChange1mo(testingMap[eod.Stats[i].Symbol].priceData)
      temp.periodStats[1] = PercentChange3mo(testingMap[eod.Stats[i].Symbol].priceData)
      temp.periodStats[2] = PercentChange6mo(testingMap[eod.Stats[i].Symbol].priceData)
      temp.periodStats[3] = PercentChangeTotal(testingMap[eod.Stats[i].Symbol].priceData)
      testingMap[eod.Stats[i].Symbol] = temp
  }
  fmt.Println(testingMap["AMZN"])
  noAnalyzedSymbols := len(testingMap)

  for k := range testingMap{
    switch (testingMap[k].Rating){
      case Sbuy:
        if testingMap[k].periodStats[4] < 10.0{
          err ++
        }
        break
      case buy:

        break
      case observe:

        break
      case sell:

        break
      case Ssell:

        break

    }
  }

//Determine percentage changes over the set of periods.
func PercentChange1mo(dat []float64) float64{
  return (1 - (dat[0] / dat[TRADEDAYSPERMONTH])) * 100
}

func PercentChange3mo(dat []float64) float64{
   return (1 - (dat[0] / dat[TRADEDAYSPERQUARTER])) * 100
}

func PercentChange6mo(dat []float64) float64{
  return (1 - (dat[0] / dat[TRADEDAYSPERQUARTER*2])) * 100
}

func PercentChangeTotal(dat []float64) float64{
  return (1 - (dat[0] / dat[len(dat)-1])) * 100
}
			/*if currIndex < lastIndex {
				status[i].dir = decline
				status[i].percentChangePrevDay = (1 - (timeSeries[i] / timeSeries[i-1])) * 100
				status[i].percentChangePrevDay = math.Round(status[i].percentChangePrevDay*100) / 100
			} else if currIndex > lastIndex {
				status[i].dir = growth
				status[i].percentChangePrevDay = (1 - (timeSeries[i-1] / timeSeries[i])) * 100
				status[i].percentChangePrevDay = math.Round(status[i].percentChangePrevDay*100) / 100*/

/*[< -3][-3 -2] [-2 -1] [-1 0] [0 1] [1 2] [2 3] [> 3]*/


/*
From the last point in analysis range non inclusive 

Find percentage change over periods [1 month 3 month 6 month total]

determine the average percentage change for each period on each tickers

Compare with the stronbuy ect rating on each Result struct.

Set a tolerance range for what is OK as a strong buy as for example 7-12%?

Strong Sell : 15-% 
Weak Sell : 5-15%??
neutral : -5% 5%
weak buy : 5-10%
strong buy : 15+

Determine number of symbols that are classified correctly via filters.

*/
