'use client';

import { useEffect, useState } from 'react';

/**
 * Web Vitals Test Page
 * Use this page to verify web vitals are being collected
 *
 * Instructions:
 * 1. Open browser DevTools Console
 * 2. Navigate to this page: /test-web-vitals
 * 3. You should see "[Web Vitals]" logs in console (development mode)
 * 4. Visit /api/analytics/web-vitals to see collected metrics
 * 5. Refresh page multiple times to collect more data
 */
export default function TestWebVitalsPage() {
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVitals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/web-vitals');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setVitals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch vitals on mount
    fetchVitals();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Web Vitals Test Page</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open browser DevTools Console (F12)</li>
            <li>Look for <code className="bg-gray-100 px-2 py-1 rounded">[Web Vitals]</code> logs</li>
            <li>Refresh this page multiple times to collect data</li>
            <li>Click "Refresh Metrics" below to see collected data</li>
            <li>Interact with the page (click, scroll) to trigger INP/FID metrics</li>
          </ol>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Collected Metrics</h2>
            <button
              onClick={fetchVitals}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh Metrics'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {vitals && (
            <div>
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Summary</h3>
                <p className="text-gray-600 mb-4">
                  Total metrics collected: <span className="font-bold">{vitals.count}</span>
                </p>

                {vitals.summary && Object.keys(vitals.summary).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(vitals.summary).map(([name, stats]: [string, any]) => (
                      <div key={name} className="border rounded p-4">
                        <h4 className="font-bold text-blue-600 mb-2">{name}</h4>
                        <div className="space-y-1 text-sm">
                          <p>Count: {stats.count}</p>
                          <p>Mean: {stats.mean}</p>
                          <p>p50: {stats.p50}</p>
                          <p>p75: {stats.p75}</p>
                          <p>p95: {stats.p95}</p>
                          <p>p99: {stats.p99}</p>
                          <p>Min: {stats.min}</p>
                          <p>Max: {stats.max}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded">
                    <p className="font-semibold">No metrics collected yet</p>
                    <p className="text-sm mt-2">
                      Refresh this page a few times and wait a few seconds for metrics to be reported.
                    </p>
                  </div>
                )}
              </div>

              {vitals.metrics && vitals.metrics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Recent Metrics (Last {vitals.metrics.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Value</th>
                          <th className="px-4 py-2 text-left">Rating</th>
                          <th className="px-4 py-2 text-left">Page</th>
                          <th className="px-4 py-2 text-left">Nav Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vitals.metrics.slice(-20).reverse().map((metric: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{metric.name}</td>
                            <td className="px-4 py-2">{metric.value.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  metric.rating === 'good'
                                    ? 'bg-green-100 text-green-800'
                                    : metric.rating === 'needs-improvement'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {metric.rating}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{metric.page}</td>
                            <td className="px-4 py-2 text-gray-600">{metric.navigationType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Web Vitals Reference</h2>
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold text-blue-600">LCP (Largest Contentful Paint)</h3>
              <p className="text-gray-600">Measures loading performance. Good: &lt;2.5s</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">FID (First Input Delay)</h3>
              <p className="text-gray-600">Measures interactivity. Good: &lt;100ms [Deprecated in favor of INP]</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">CLS (Cumulative Layout Shift)</h3>
              <p className="text-gray-600">Measures visual stability. Good: &lt;0.1</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">FCP (First Contentful Paint)</h3>
              <p className="text-gray-600">Measures when first content appears. Good: &lt;1.8s</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">TTFB (Time to First Byte)</h3>
              <p className="text-gray-600">Measures server response time. Good: &lt;800ms</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600">INP (Interaction to Next Paint)</h3>
              <p className="text-gray-600">Measures responsiveness to user interactions. Good: &lt;200ms</p>
            </div>
          </div>
        </div>

        {/* Interaction test elements */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">Interaction Test</h2>
          <p className="text-gray-600 mb-4">Click these buttons to trigger INP/FID measurements:</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                // Simulate some work
                const start = Date.now();
                while (Date.now() - start < 50) {
                  // Busy wait
                }
                alert('Button clicked!');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Click Me (50ms work)
            </button>
            <button
              onClick={() => alert('Quick response!')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Quick Click
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
