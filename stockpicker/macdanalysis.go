package stockpicker

import (
	mw "SMA/middleware"
	"SMA/util"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"sort"
	"sync"
)

type MACD struct {
  Stats []MACDstats
  Mean float64
  Variance float64
  Stdev float64
}

type MACDstats struct {
  Symbol     string
  Raw        float64
  Normalized float64
  Rating    rating
}


const patternConfirm = 2
const TBoundary = 70.0
const BBoundary = 30.0

func MACDAnalysis(wholeMacd []float64, wholeSignal []float64, period int) float64 {
	var startMacd int
	var startSignal int

	if period < len(wholeMacd) {
		startMacd = len(wholeMacd) - period
	} else {
		startMacd = 0
	}

	if period < len(wholeSignal) {
		startSignal = len(wholeSignal) - period
	} else {
		startSignal = 0
	}
	macd := wholeMacd[startMacd:]
	signal := wholeSignal[startSignal:]

	var msdiff []float64
	for i, j := 0, len(macd)-len(signal); i < len(signal); i, j = i+1, j+1 {
		msdiff = append(msdiff, macd[j]-signal[i])
	}

	var ddiff [][]float64

	for i := 0; i < len(msdiff)-1; i++ {
		var values []float64

		values = append(values, msdiff[i+1]-msdiff[i])

		if msdiff[i] < 0 {
			values = append(values, 1)
		} else {
			values = append(values, 0)
		}

		if msdiff[i+1] < 0 {
			values = append(values, 1)
		} else {
			values = append(values, 0)
		}

		ddiff = append(ddiff, values)
	}

	var pattern []float64

	i := 0

	for i < len(ddiff) {
		count := 0.0

		for i < len(ddiff) {
			if ddiff[i][1] == 1 {
				if ddiff[i][1] != ddiff[i][2] {
					count = count - 1.0
					pattern = append(pattern, count)
					i++
					break
				} else {
					count = count - 1.0
				}
			} else {
				if ddiff[i][1] != ddiff[i][2] {
					count = count + 1.0
					pattern = append(pattern, count)
					i++
					break
				} else {
					count = count + 1.0
				}
			}

			i++

			if i == len(ddiff) {
				pattern = append(pattern, count)
			}

			if len(pattern) > 2 {
				if pattern[len(pattern)-1] <= patternConfirm && pattern[len(pattern)-1] >= -patternConfirm {
					pattern[len(pattern)-2] = pattern[len(pattern)-2] + pattern[len(pattern)-1]
					pattern = pattern[:len(pattern)-1]
				}

				if (pattern[len(pattern)-1] < 0 && pattern[len(pattern)-2] < 0) || (pattern[len(pattern)-1] > 0 && pattern[len(pattern)-2] > 0) {
					pattern[len(pattern)-2] = pattern[len(pattern)-1] + pattern[len(pattern)-2]
					pattern = pattern[:len(pattern)-1]
				}
			}
		}
	}

	convergenceCount := len(pattern) - 1

	if convergenceCount == 0 {
		convergenceCount = 1
	}

	var msdiffInterval [][]float64

	for s, j := 0, 0; j < len(pattern); j++ {
		e := s + int(math.Abs(pattern[j]))

		msdiffInterval = append(msdiffInterval, msdiff[s:e])

		s = e
	}

	var msdiffSums []float64

	for j := 0; j < len(msdiffInterval); j++ {
		msdiffSum := 0.0
		for k := 0; k < len(msdiffInterval[j]); k++ {
			msdiffSum += msdiffInterval[j][k]
		}
		msdiffSums = append(msdiffSums, msdiffSum)
	}

	// var macdInterval [][]float64

	// for s, j := len(macd) - len(signal), 0; j < len(pattern); j++ {
	// 	e := s + int(math.Abs(pattern[j]))

	// 	macdInterval = append(macdInterval, macd[s:e])

	// 	s = e
	// }

	// var macdSums []float64

	// for j := 0; j < len(macdInterval); j++ {
	// 	macdSum := 0.0
	// 	for k := 0; k < len(macdInterval[j]); k++ {
	// 		macdSum += macdInterval[j][k]
	// 	}
	// 	macdSums = append(macdSums, macdSum)
	// }

	var signalInterval [][]float64

	for s, j := 0, 0; j < len(pattern); j++ {
		e := s + int(math.Abs(pattern[j]))

		signalInterval = append(signalInterval, signal[s:e])

		s = e
	}

	var signalSums []float64

	for j := 0; j < len(signalInterval); j++ {
		signalSum := 0.0
		for k := 0; k < len(signalInterval[j]); k++ {
			signalSum += signalInterval[j][k]
		}
		signalSums = append(signalSums, signalSum)
	}

	// var totalSumsM []float64
	var totalSumsS []float64

	for j := 0; j < len(signalSums); j++ {
		// totalSumM := macdSums[j] + msdiffSums[j]
		// totalSumsM = append(totalSumsM, totalSumM)

		totalSumS := signalSums[j] + msdiffSums[j]
		totalSumsS = append(totalSumsS, totalSumS)
	}

	// weightedSumM := 0.0
	weightedSumS := 0.0

	for j := 0; j < len(pattern); j++ {
		// weightedSumM += totalSumsM[j] * math.Abs(pattern[j])
		weightedSumS += totalSumsS[j] * math.Abs(pattern[j])
	}

	// weightedAvgM := weightedSumM / float64(convergenceCount)
	weightedAvgS := weightedSumS / float64(convergenceCount)

	// fmt.Printf("%f\t%f\t", weightedAvgM, weightedAvgS)

	return weightedAvgS
}



/*Every value in tickers[i] has a MACD weighted average (RAW) score.*/
func MACDanalysisEngine(){
  var wg sync.WaitGroup
  stat := make([]MACDstats,0)
	db := mw.CreateConnection()
	tickers := util.ReadTickerList("../util/NASDAQ.txt")
  wg.Add(len(tickers))
	var MACDwAvg []float64
	for i := 0; i < len(tickers); i++ {
    go func(i int){
    var tmp MACDstats
    tmp.Symbol = tickers[i]
		math := mw.GetMathDataByTicker(db, tickers[i])
    tmp.Raw =  MACDAnalysis(math.MACD, math.MACDsignal, 1265)
    stat = append(stat, tmp)
		fmt.Printf("%s\t", tickers[i])
    wg.Done()
  }(i)
}
  wg.Wait()
  statpak := ComputeNormalizedValueMACD(stat)
	sort.SliceStable(statpak.Stats, func(i, j int) bool {
		return statpak.Stats[i].Normalized < statpak.Stats[j].Normalized
	})
	fmt.Println(MACDwAvg)
  bins,_  := json.MarshalIndent(FitBinsMACD(statpak),"", " ")
  blob,_  := json.MarshalIndent(statpak,"", " ")
  _ = ioutil.WriteFile("binmacd.json",bins,0777)
  _ = ioutil.WriteFile("macd.json",blob,0777)
  fmt.Println("Hi")


}
