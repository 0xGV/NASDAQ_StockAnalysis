package ds

type MathData struct {
	Ticker		string
	SMA 		[]float64
	EMA 		[]float64
	MACD 		[]float64
	MACDsignal  []float64
	RSI 		[]float64
	MidBand		[]float64
	LowBand		[]float64
	HighBand	[]float64
	Dates		[]string
}