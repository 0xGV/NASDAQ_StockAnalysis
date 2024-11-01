package ds

type Picks struct {
	Ticker 			string `json:"symbol"`
	Price 			string `json:"price"`
	MarketCap 		string `json:"market"`
	PercentChange   string `json:"pchange"`
	EOD				string `json:"eod"`
	Technical 		string `json:"technical"`
	Fundamental		string `json:"fundamental"`
	Index           string `json:"index"`
	Rating			string `json:"rating"`
}
