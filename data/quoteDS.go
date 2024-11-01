package ds

type SymbolData struct {
	Ticker string         `json:"Ticker"`
	Dat    []HistoricData `json:"dat"`
}
type HistoricData struct {
	Ticker string
	Date   string
	Open   string
	High   string
	Low    string
	Close  string
	Volume string
	PercentChange string
}
