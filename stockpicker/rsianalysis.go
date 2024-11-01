package stockpicker

import (
	mw "SMA/middleware"
	"SMA/util"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"sort"
	"sync"
)

type RSI struct {
  Stats []RSIstats
  Mean float64
  Variance float64
  Stdev float64
}

type RSIstats struct {
  Symbol     string
  Raw        float64
  Normalized float64
  Rating    rating
}

const TBoundary = 70.0
const BBoundary = 30.0

func RSIAnalysis(wholeRsi []float64, period int) float64 {
	var start int

	if period < len(wholeRsi) {
		start = len(wholeRsi) - period
	} else {
		start = 0
	}

	rsi := wholeRsi[start:]

	sum := 0.0

	for i := 0; i < len(rsi); i++ {
		if rsi[i] >= TBoundary {
			sum += (rsi[i] - BBoundary)
		} else if rsi[i] <= BBoundary {
			sum -= (TBoundary - rsi[i])
		} else if rsi[i] < TBoundary && rsi[i] > 50.0 {
			sum += (rsi[i] - 50.0)
		} else {
			sum -= (50.0 - rsi[i])
		}
	}

	return sum
}

/*Every value in tickers[i] has a MACD weighted average (RAW) score.*/
func RSIanalysisEngine() {
	var wg sync.WaitGroup
	stat := make([]RSIstats, 0)
	db := mw.CreateConnection()
	tickers := util.ReadTickerList("../util/NASDAQ.txt")
	wg.Add(len(tickers))
	var RSIwAvg []float64
	for i := 0; i < len(tickers); i++ {
		go func(i int) {
			var tmp RSIstats
			tmp.Symbol = tickers[i]
			math := mw.GetMathDataByTicker(db, tickers[i])
			tmp.Raw = RSIAnalysis(math.RSI, 1265)
			stat = append(stat, tmp)
			fmt.Printf("%s\t", tickers[i])
			wg.Done()
		}(i)
	}
	wg.Wait()
	statpak := ComputeNormalizedValueRSI(stat)
	sort.SliceStable(statpak.Stats, func(i, j int) bool {
		return statpak.Stats[i].Normalized < statpak.Stats[j].Normalized
	})
	fmt.Println(RSIwAvg)
	bins, _ := json.MarshalIndent(FitBinsRSI(statpak), "", " ")
	blob, _ := json.MarshalIndent(statpak, "", " ")
	_ = ioutil.WriteFile("binrsi.json", bins, 0777)
	_ = ioutil.WriteFile("rsi.json", blob, 0777)
	fmt.Println("Hi")
}
