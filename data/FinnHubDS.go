package ds

type FinnhubQuote struct {
	Open     float64 `json:"o"`
	High     float64 `json:"h"`
	Low      float64 `json:"l"`
	Current  float64 `json:"c"`
	Previous float64 `json:"pc"`
	PercentChange float64 `json:"dp"`
}

type FinnhubStockPrice struct {
	Names  []string
	Prices []FinnhubQuote
	Time   []string
}
