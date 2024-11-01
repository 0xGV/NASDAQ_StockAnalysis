package main

import (
	ds "SMA/data"
	"SMA/math"
	mw "SMA/middleware"
	util "SMA/util"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func main() {
	availableSymbols := util.ReadTickerList("./util/NASDAQ.txt")
	r := gin.Default()
	// load all html files
	r.LoadHTMLFiles("SMADEMO/chart/chart.html", "SMADEMO/404.html", "SMADEMO/about.html",
		"SMADEMO/learn.html", "SMADEMO/home.html", "SMADEMO/explore.html")

	// load all static files, like CSS, JS, etc.
	r.Static("chart/js", "./SMADEMO/chart/js")
	r.Static("/css", "./SMADEMO/css")
	r.Static("/js", "./SMADEMO/js")
	r.StaticFile("/favicon.ico", "./SMADEMO/favicon.ico")
	r.StaticFile("/404error.png", "./SMADEMO/404error.png")
	// homepage
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "home", nil)
	})

	// this handles the chart page, with dynamic data
	r.GET("/chart/:ticker", func(c *gin.Context) {
		var ticker string = strings.ToUpper(c.Param("ticker"))
		if util.Match(availableSymbols, strings.ToUpper(ticker)) {
			var dbConnection = mw.CreateConnection()
			var datas ds.SymbolData = mw.GetQuoteDataByTicker(dbConnection, ticker)
			var fund ds.AlphaStruct = mw.GetFundamentalDataByTicker(dbConnection, ticker)
			// var math ds.MathData = mw.GetMathDataByTicker(dbConnection, ticker)
			var math ds.MathData = math.DoMathForTicker(dbConnection, ticker)
			c.HTML(http.StatusOK, "dchart", gin.H{
				"title":       ticker,
				"data":        datas, // quote data
				"fundamental": fund,  // statistics data
				"math":        math,  // technical data
			})
		} else {
			var didYouMean = util.FindClosestMatch(availableSymbols, ticker)
			c.HTML(http.StatusNotFound, "404", gin.H{
				"didYouMean": didYouMean,
			})
		}
	})

	// stock screener
	r.GET("/explore", func(c *gin.Context) {
		c.HTML(http.StatusOK, "explore", nil)
	})

	// getting started page
	r.GET("/learn", func(c *gin.Context) {
		c.HTML(http.StatusOK, "learn", nil)
	})

	// about page
	r.GET("/about", func(c *gin.Context) {
		c.HTML(http.StatusOK, "about", nil)
	})

	// any page that can't be found is rerouted to the 404.html page
	r.NoRoute(func(c *gin.Context) {
		c.HTML(http.StatusNotFound, "404", nil)
	})

	r.Run()
}
