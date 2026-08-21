/**
 * Interactive OneVizion Search Builder
 *
 * Demonstrates dynamic trackor search with query builder
 */

import { OneVizionClient, OneVizionProvider, search, widgetAuth } from '@onevizion/sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// Create OneVizion client with widget auth
const client = new OneVizionClient({
  baseUrl: window.location.origin,
  auth: widgetAuth({ baseUrl: window.location.origin }),
});

const queryClient = new QueryClient();

// Search Builder Component
function SearchBuilder() {
  const [trackorType, setTrackorType] = useState('ASSET');
  const [field, setField] = useState('STATUS');
  const [operator, setOperator] = useState('equal');
  const [value, setValue] = useState('');
  const [conditions, setConditions] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryString, setQueryString] = useState('');

  // Add condition to the list
  const addCondition = () => {
    if (!field || !value) return;

    setConditions([...conditions, { field, operator, value }]);
    setValue(''); // Clear input
  };

  // Remove condition
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // Build query and search
  const executeSearch = async () => {
    if (conditions.length === 0) {
      setError('Add at least one search condition');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query using fluent API
      let query = search();

      conditions.forEach((condition, index) => {
        // Add AND between conditions
        if (index > 0) {
          query = query.and();
        }

        // Add condition based on operator
        switch (condition.operator) {
          case 'equal':
            query = query.equal(condition.field, condition.value);
            break;
          case 'notEqual':
            query = query.notEqual(condition.field, condition.value);
            break;
          case 'greater':
            query = query.greater(condition.field, parseFloat(condition.value) || condition.value);
            break;
          case 'less':
            query = query.less(condition.field, parseFloat(condition.value) || condition.value);
            break;
          case 'isNull':
            query = query.isNull(condition.field);
            break;
          case 'isNotNull':
            query = query.isNotNull(condition.field);
            break;
          case 'greaterThanToday':
            query = query.greaterThanToday(condition.field, parseInt(condition.value) || 0);
            break;
          case 'thisWeek':
            query = query.thisWeek(condition.field);
            break;
          case 'thisMonth':
            query = query.thisMonth(condition.field);
            break;
        }
      });

      const queryStr = query.toString();
      setQueryString(queryStr);

      // Execute search
      const data = await client.trackors.search(trackorType, query, {
        perPage: 10,
      });

      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset search
  const reset = () => {
    setConditions([]);
    setResults([]);
    setQueryString('');
    setError(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>OneVizion Search Builder</h1>

      {/* Trackor Type Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Trackor Type:
        </label>
        <input
          type="text"
          value={trackorType}
          onChange={(e) => setTrackorType(e.target.value.toUpperCase())}
          placeholder="e.g., ASSET, BILL_OF_MATERIALS"
          style={{
            padding: '8px',
            width: '300px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
          Enter the trackor type name (not label)
        </small>
      </div>

      {/* Condition Builder */}
      <div
        style={{
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Add Search Condition</h3>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value.toUpperCase())}
            placeholder="Field name (e.g., STATUS)"
            style={{
              padding: '8px',
              flex: '1',
              minWidth: '150px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="equal">Equal</option>
            <option value="notEqual">Not Equal</option>
            <option value="greater">Greater Than</option>
            <option value="less">Less Than</option>
            <option value="isNull">Is Null</option>
            <option value="isNotNull">Is Not Null</option>
            <option value="greaterThanToday">Greater Than Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
          </select>

          {!['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator) && (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
              style={{
                padding: '8px',
                flex: '1',
                minWidth: '150px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          )}

          <button
            onClick={addCondition}
            disabled={
              !field ||
              (!value && !['isNull', 'isNotNull', 'thisWeek', 'thisMonth'].includes(operator))
            }
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>

        {/* Conditions List */}
        {conditions.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <strong>Conditions:</strong>
            {conditions.map((condition, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  marginTop: '5px',
                }}
              >
                <span style={{ flex: 1 }}>
                  {index > 0 && <span style={{ color: '#666', marginRight: '5px' }}>AND</span>}
                  <code>
                    {condition.field} {condition.operator} {condition.value || ''}
                  </code>
                </span>
                <button
                  onClick={() => removeCondition(index)}
                  style={{
                    padding: '4px 8px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button
            onClick={executeSearch}
            disabled={conditions.length === 0 || isLoading}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: conditions.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>

          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Generated Query String */}
      {queryString && (
        <div style={{ marginBottom: '20px' }}>
          <strong>Generated Query:</strong>
          <pre
            style={{
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '4px',
              overflowX: 'auto',
              fontSize: '12px',
            }}
          >
            {queryString}
          </pre>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '10px',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h3>Results ({results.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    Fields
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((trackor) => (
                  <tr key={trackor.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px' }}>{trackor.id}</td>
                    <td style={{ padding: '10px' }}>{trackor.trackorType}</td>
                    <td style={{ padding: '10px' }}>
                      <pre style={{ margin: 0, fontSize: '11px' }}>
                        {JSON.stringify(trackor.fields, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length === 0 && queryString && !isLoading && !error && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No results found</div>
      )}
    </div>
  );
}

// Main App
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OneVizionProvider client={client}>
        <SearchBuilder />
      </OneVizionProvider>
    </QueryClientProvider>
  );
}

// Mount app
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
