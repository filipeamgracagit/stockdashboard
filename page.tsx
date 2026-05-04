import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const IndicatorRow = ({ name, value, yoy, rating }) => (
  <div className="grid grid-cols-4 border border-green-500 text-sm">
    <div className="bg-green-600 p-2">{name}</div>
    <div className="bg-black p-2">{value}</div>
    <div className="bg-black p-2">{yoy}</div>
    <div className="bg-black p-2 text-center">{rating}</div>
  </div>
);

export default function StockApp() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_KEY = "xvPpuAQxIWyjyviJUarC2rCWBB3QOpYF";

  const analyze = async () => {
    if (!symbol) return;
    setLoading(true);

    try {
      const [profileRes, metricsRes, incomeRes, historyRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${API_KEY}`),
        fetch(`https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?limit=1&apikey=${API_KEY}`),
        fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=1&apikey=${API_KEY}`),
        fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=5&apikey=${API_KEY}`)
      ]);

      const profile = await profileRes.json();
      const metrics = await metricsRes.json();
      const income = await incomeRes.json();
      const history = await historyRes.json();

      const m = metrics[0];
      const i = income[0];

      const chartData = history.reverse().map((q) => ({
        quarter: q.period,
        revenue: q.revenue / 1e9,
        eps: q.eps
      }));

      const score = (
        (m.roe > 0.15 ? 3 : 1) +
        (i.netIncome > 0 ? 3 : 1) +
        (m.peRatio < 25 ? 2 : 1)
      );

      const result = {
        name: profile[0]?.companyName || symbol,
        price: `$${profile[0]?.price?.toFixed(2)}`,
        change: `${profile[0]?.changesPercentage?.toFixed(2)}%`,
        indicators: [
          {
            name: "Receita",
            value: `$${(i.revenue / 1e9).toFixed(2)}B`,
            yoy: "-",
            rating: i.revenue > 0 ? "🟢" : "🔴"
          },
          {
            name: "Lucro líquido",
            value: `$${(i.netIncome / 1e9).toFixed(2)}B`,
            yoy: "-",
            rating: i.netIncome > 0 ? "🟢" : "🔴"
          },
          {
            name: "EPS",
            value: i.eps?.toFixed(2),
            yoy: "-",
            rating: i.eps > 0 ? "🟢" : "🔴"
          },
          {
            name: "ROE",
            value: `${(m.roe * 100).toFixed(1)}%`,
            yoy: "-",
            rating: m.roe > 0.15 ? "🟢" : "🟡"
          }
        ],
        interpretation: [
          i.netIncome > 0 ? "Empresa lucrativa" : "Prejuízo recente",
          m.roe > 0.15 ? "Alta eficiência" : "Eficiência moderada",
          m.peRatio < 25 ? "Valuation saudável" : "Valuation elevado"
        ],
        chartData,
        score
      };

      setData(result);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-green-400 mb-6">Financial Dashboard</h1>

      <div className="flex gap-2 mb-6">
        <Input placeholder="Ticker (ex: AAPL)" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <Button onClick={analyze}>Analisar</Button>
      </div>

      {loading && <p>Loading...</p>}

      {data && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl text-green-400">{data.name}</h2>
            <div className="text-right">
              <p className="text-2xl font-bold">{data.price}</p>
              <p className="text-green-400">{data.change}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-900 border border-green-500 col-span-2">
              <CardContent>
                <h3 className="text-green-400 mb-3">Indicadores</h3>
                <div className="grid grid-cols-4 font-bold border border-green-500">
                  <div className="p-2">Indicador</div>
                  <div className="p-2">Valor</div>
                  <div className="p-2">YoY</div>
                  <div className="p-2 text-center">Avaliação</div>
                </div>
                {data.indicators.map((item, i) => (
                  <IndicatorRow key={i} {...item} />
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border border-green-500">
              <CardContent>
                <h3 className="text-green-400 mb-3">Score</h3>
                <div className="text-center text-4xl font-bold text-green-400">{data.score}/10</div>
                <p className="text-center mt-2 text-sm">Avaliação geral</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border border-green-500 mb-6">
            <CardContent>
              <h3 className="text-green-400 mb-3">Evolução trimestral</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData}>
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" />
                  <Bar dataKey="eps" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-green-500">
            <CardContent>
              <h3 className="text-green-400 mb-3">Interpretação</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {data.interpretation.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
