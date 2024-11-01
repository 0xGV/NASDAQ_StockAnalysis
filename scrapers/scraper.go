package main

import (
	util "SMA/util"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	var tickers = util.ReadTickerList("../util/NASDAQ.txt")
	wg.Add(1)

	//go func() {
	//	scrapeAlphaVantage(tickers)
	//		wg.Done()
	//	}()
	//go func() {
	//		scrapePolygon(tickers)
	//
	//		wg.Done()
	//	}()

	go func() {
		scrapeFinnhub(tickers)
		wg.Done()
	}()

	wg.Wait()

}
