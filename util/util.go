package util

import (
	"io/ioutil"
	"log"
	"math"
	"sort"
	"strings"
)

type distances struct {
	symbol   string
	distance int
}

func ReadTickerList(fileLocation string) []string {
	var tickerslice []string

	nasdaqTickers, err := ioutil.ReadFile(fileLocation)
	if err != nil {
		log.Fatal(err)
	}

	split := strings.Split(string(nasdaqTickers), "\n")

	//fmt.Print(split)
	for i := 1; i < len(split)-1; i++ {
		tempticker := strings.Fields(string(split[i]))[0]
		//fmt.Println(tempticker)
		tickerslice = append(tickerslice, tempticker)
	}
	return tickerslice
}

func Match(symbolList []string, query string) bool {

	for _, symbol := range symbolList {
		if strings.ToUpper(query) == strings.ToUpper(symbol) {
			return true
		}
	}

	return false
}

func HammingDistance(s1, s2 string) int {
	hd := 0
	leng := 0
	if len(s1) != len(s2) {
		dif := len(s1) - len(s2)
		dif = int(math.Abs(float64(dif)))
		hd += dif
	}
	if len(s1) > len(s2) {
		leng = len(s2)
	} else {
		leng = len(s1)
	}
	for i := 0; i < leng; i++ {
		if s1[i] != s2[i] {
			hd++
		}
	}
	return hd
}

func FindClosestMatch(s []string, input string) []string {
	dist := make([]distances, 0)

	for i := range s {
		dist = append(dist, distances{
			symbol:   s[i],
			distance: HammingDistance(input, s[i]),
		})
	}
	sort.SliceStable(dist, func(i, j int) bool {
		return dist[i].distance < dist[j].distance
	})
	top5 := make([]string, 0)
	for i := 0; i < 5; i++ {
		top5 = append(top5, dist[i].symbol)
	}
	return top5
}
